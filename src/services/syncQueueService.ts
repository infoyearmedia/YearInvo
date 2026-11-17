/**
 * Offline Synchronization Queue & Sync Status Service for YearInvo
 *
 * Manages:
 * - Online/Offline lifecycle detection & automatic reconnect triggers
 * - Idempotent sync queue processing (FIFO) against Supabase PostgreSQL
 * - Deduplication of sales, stock adjustments, customers, and expenses
 *   (Supabase row upserts are idempotent by id)
 * - Safe offline authorization grace period validation
 * - Real-time sync status broadcasting to UI components
 *
 * HISTORY / WHY THIS IS SUPABASE-ONLY:
 * The queue previously flushed every operation to Firestore
 * (users/{uid}/businessData/*). That Firestore project is gone, so every
 * flush failed forever: failed ops stayed in the IndexedDB queue, the
 * error flag stuck, and the UI showed "Sync issue — Retrying..." on every
 * account even though data saved fine. The queue now flushes to Supabase
 * via the per-row upserts in supabaseDbService, and the indicator state
 * is driven only by real Supabase outcomes (reported here by
 * cloudSyncService after each save / initial load). No Firestore code
 * remains in this file.
 *
 * NOTE — collections with no Supabase table: adjustments, dueCollections,
 * investments, capitalWithdrawals, payroll, settings, onlineSettings,
 * onlineCustomers and onlineProducts have no Supabase mapping in
 * saveUserCloudCollection either, so there is no cloud row to push those
 * ops to. Those ops are drained (their data already lives in localStorage
 * / IndexedDB via AppContext) and never set the error state. Only the
 * collections that actually live in Supabase can fail the queue.
 */

import { offlineDb, SyncQueueItem } from './offlineDb';
import {
  saveSupabaseProduct,
  saveSupabaseSale,
  saveSupabaseCustomer,
  saveSupabaseSupplier,
  saveSupabaseExpense,
  saveSupabasePurchase,
  saveSupabaseOnlineOrder,
} from './supabaseDbService';

export type SyncStatus = 'online' | 'offline' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

// 14-day maximum offline grace period for authenticated cached subscriptions
export const MAX_OFFLINE_GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000;

/** Outcome of the most recent real Supabase operation. 'unknown' until the
 *  first save / load reports in (the initial Supabase load at login reports
 *  immediately, so this is only the pre-login state). */
type CloudStatus = 'unknown' | 'ok' | 'error';

class SyncQueueService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing: boolean = false;
  private currentUserId: string | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private pendingCount: number = 0;
  private lastSyncedAt: string | null = null;
  private errorMessage: string | null = null;
  private cloudStatus: CloudStatus = 'unknown';
  private syncTimer: any = null;
  private lastNotifiedKey: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncQueue] Network connection restored: ONLINE');
        this.isOnline = true;
        this.notifyState();
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        console.log('[SyncQueue] Network connection lost: OFFLINE');
        this.isOnline = false;
        this.notifyState();
      });

      // Periodic retry every 30 seconds when online
      this.syncTimer = setInterval(() => {
        if (this.isOnline && !this.isSyncing && this.currentUserId) {
          this.triggerSync();
        }
      }, 30000);
    }
  }

  public setUserId(userId: string | null) {
    this.currentUserId = userId;
    if (userId) {
      this.refreshPendingCount();
    } else {
      this.pendingCount = 0;
      this.notifyState();
    }
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SyncState {
    let computedStatus: SyncStatus = 'online';
    if (!this.isOnline) {
      computedStatus = 'offline';
    } else if (this.isSyncing) {
      computedStatus = 'syncing';
    } else if (this.cloudStatus === 'error') {
      // Only a real Supabase failure reaches this state — never the old
      // dead Firestore queue.
      computedStatus = 'error';
    } else if (this.pendingCount === 0) {
      computedStatus = 'synced';
    }

    return {
      status: computedStatus,
      isOnline: this.isOnline,
      pendingCount: this.pendingCount,
      lastSyncedAt: this.lastSyncedAt,
      errorMessage: this.errorMessage,
    };
  }

  /**
   * Report the outcome of a real Supabase operation (save or initial load).
   * Called by cloudSyncService.saveUserCloudCollection /
   * subscribeToUserBusinessData. This is the ONLY thing that sets or clears
   * the error state shown by SyncStatusIndicator.
   */
  public reportCloudResult(ok: boolean, errorMessage?: string): void {
    if (ok) {
      this.cloudStatus = 'ok';
      this.errorMessage = null;
      this.lastSyncedAt = new Date().toISOString();
    } else {
      this.cloudStatus = 'error';
      this.errorMessage =
        errorMessage || 'Could not reach the cloud database. Will retry automatically.';
    }
    this.notifyState();
  }

  private notifyState() {
    const state = this.getState();
    // Saves report in very frequently (every cloud write); skip notifying
    // when nothing the UI shows actually changed.
    const key = [
      state.status,
      state.isOnline,
      state.pendingCount,
      state.lastSyncedAt,
      state.errorMessage,
    ].join('|');
    if (key === this.lastNotifiedKey) return;
    this.lastNotifiedKey = key;
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (e) {}
    });
  }

  public async refreshPendingCount(): Promise<number> {
    if (!this.currentUserId) {
      this.pendingCount = 0;
      this.notifyState();
      return 0;
    }

    try {
      const items = await offlineDb.getPendingOperations(this.currentUserId);
      this.pendingCount = items.length;
      this.notifyState();
      return this.pendingCount;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Enqueue a local business operation
   */
  public async enqueue(
    operationType: SyncQueueItem['operationType'],
    payload: any
  ): Promise<string> {
    const opId = `op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const userId = this.currentUserId || 'default_user';

    const item: SyncQueueItem = {
      opId,
      userId,
      operationType,
      localTimestamp: new Date().toISOString(),
      payload,
      syncStatus: 'PENDING_SYNC',
      retryCount: 0,
      error: null,
    };

    console.log(`[SyncQueue] Enqueueing operation: ${operationType} (id=${opId})`);
    await offlineDb.enqueueOperation(item);
    await this.refreshPendingCount();

    // If online, immediately attempt background sync
    if (this.isOnline && !this.isSyncing && this.currentUserId) {
      this.triggerSync().catch(() => {});
    }

    return opId;
  }

  /**
   * Process all queued operations against Supabase
   */
  public async triggerSync(): Promise<boolean> {
    if (this.isSyncing) return false;
    if (!this.currentUserId) return false;
    if (!this.isOnline) {
      this.notifyState();
      return false;
    }

    const userId = this.currentUserId;
    const pendingOps = await offlineDb.getPendingOperations(userId);

    if (pendingOps.length === 0) {
      // Nothing queued. A previous real Supabase error stays visible until
      // a save / load succeeds; otherwise we are synced.
      if (this.cloudStatus !== 'error') {
        this.cloudStatus = 'ok';
        this.errorMessage = null;
      }
      this.lastSyncedAt = new Date().toISOString();
      this.notifyState();
      return true;
    }

    this.isSyncing = true;
    this.errorMessage = null;
    this.notifyState();

    console.log(`[SyncQueue] Starting sync for ${pendingOps.length} pending operations...`);

    let anyFailed = false;

    for (const op of pendingOps) {
      try {
        await offlineDb.updateOperationStatus(op.opId, 'SYNCING');
        await this.processSingleOperation(userId, op);
        await offlineDb.removeOperation(op.opId);
        console.log(`[SyncQueue] Operation ${op.opId} (${op.operationType}) synced successfully.`);
      } catch (err: any) {
        console.warn(`[SyncQueue] Operation ${op.opId} failed:`, err);
        anyFailed = true;
        const errMsg = err?.message || 'Sync failed';
        await offlineDb.updateOperationStatus(op.opId, 'FAILED', errMsg);
      }
    }

    this.isSyncing = false;
    this.lastSyncedAt = new Date().toISOString();
    await this.refreshPendingCount();

    if (anyFailed) {
      // Real Supabase failure only — this is what shows the error banner.
      this.cloudStatus = 'error';
      this.errorMessage = 'Some changes could not be synced. Will retry automatically.';
    } else {
      this.cloudStatus = 'ok';
      this.errorMessage = null;
    }

    this.notifyState();
    return !anyFailed;
  }

  /** Normalize a payload that may be a single object, an array, or undefined. */
  private toArray<T>(value: any): T[] {
    if (Array.isArray(value)) return value as T[];
    if (value === undefined || value === null) return [];
    return [value as T];
  }

  /** Upsert every row; throws on the first failed write so the op stays queued. */
  private async saveAll<T>(
    userId: string,
    items: T[] | undefined,
    saver: (userId: string, item: T) => Promise<boolean>,
    label: string
  ): Promise<void> {
    if (!items || items.length === 0) return;
    for (const item of items) {
      const ok = await saver(userId, item);
      if (!ok) throw new Error(`Supabase write failed (${label})`);
    }
  }

  /**
   * Push a single queued operation to Supabase with idempotent row upserts.
   * Throws when a Supabase write fails so the op stays FAILED and retries.
   *
   * This matters for CREATE_SALE: checkoutPOS (used by both POS and Quick
   * Sale) never calls saveUserCloudCollection — the queue is its ONLY cloud
   * path. Before this fix its sale/product/customer rows went to the dead
   * Firestore queue and never reached Supabase at all.
   */
  private async processSingleOperation(userId: string, op: SyncQueueItem): Promise<void> {
    switch (op.operationType) {
      case 'CREATE_SALE': {
        const sale = op.payload?.sale;
        if (!sale) throw new Error('CREATE_SALE payload has no sale');
        if (!(await saveSupabaseSale(userId, sale))) {
          throw new Error('Supabase write failed (sale)');
        }
        await this.saveAll(userId, this.toArray(op.payload?.products), saveSupabaseProduct, 'products');
        await this.saveAll(userId, this.toArray(op.payload?.customers), saveSupabaseCustomer, 'customers');
        break;
      }

      case 'BATCH_UPDATE_PRODUCTS':
      case 'UPDATE_PRODUCT': {
        const products = this.toArray(op.payload?.products ?? op.payload);
        await this.saveAll(userId, products, saveSupabaseProduct, 'products');
        break;
      }

      case 'CREATE_EXPENSE': {
        const expense = op.payload?.expense;
        if (!expense) throw new Error('CREATE_EXPENSE payload has no expense');
        if (!(await saveSupabaseExpense(userId, expense))) {
          throw new Error('Supabase write failed (expense)');
        }
        break;
      }

      case 'CREATE_CUSTOMER':
      case 'UPDATE_CUSTOMER': {
        const customers = this.toArray(op.payload?.customers ?? op.payload);
        await this.saveAll(userId, customers, saveSupabaseCustomer, 'customers');
        break;
      }

      case 'CREATE_SUPPLIER':
      case 'UPDATE_SUPPLIER': {
        const suppliers = this.toArray(op.payload?.suppliers ?? op.payload);
        await this.saveAll(userId, suppliers, saveSupabaseSupplier, 'suppliers');
        break;
      }

      case 'CREATE_PURCHASE': {
        const purchase = op.payload?.purchase;
        if (!purchase) throw new Error('CREATE_PURCHASE payload has no purchase');
        if (!(await saveSupabasePurchase(userId, purchase))) {
          throw new Error('Supabase write failed (purchase)');
        }
        await this.saveAll(userId, this.toArray(op.payload?.products), saveSupabaseProduct, 'products');
        await this.saveAll(userId, this.toArray(op.payload?.suppliers), saveSupabaseSupplier, 'suppliers');
        break;
      }

      case 'CREATE_ONLINE_ORDER':
      case 'UPDATE_ONLINE_ORDER': {
        // Payload is a single order object (AppContext enqueues newOrder /
        // targetOrder); the old Firestore code also accepted { orders: [] }.
        const orders = this.toArray(op.payload?.orders ?? op.payload?.order ?? op.payload);
        await this.saveAll(userId, orders, saveSupabaseOnlineOrder, 'onlineOrders');
        // op.payload.updatedOnlineProducts has no Supabase table mapping
        // (saveUserCloudCollection doesn't persist onlineProducts either);
        // it already lives in localStorage / IndexedDB via AppContext.
        break;
      }

      case 'CREATE_ONLINE_CUSTOMER':
      case 'UPDATE_ONLINE_CUSTOMER':
      case 'CREATE_ONLINE_PRODUCT':
      case 'UPDATE_ONLINE_PRODUCT':
      case 'DELETE_ONLINE_PRODUCT':
      case 'STOCK_ADJUSTMENT':
      case 'DUE_COLLECTION':
      case 'CREATE_INVESTMENT':
      case 'CREATE_CAPITAL_WITHDRAWAL':
      case 'PAYROLL_PAYMENT':
      case 'SALARY_ADJUSTMENT':
      case 'UPDATE_SETTINGS':
      case 'UPDATE_ONLINE_SETTINGS': {
        // No Supabase table exists for these collections (the main save path
        // in saveUserCloudCollection doesn't persist them either). The data
        // already lives in localStorage / IndexedDB via AppContext, so the
        // op is drained here instead of failing forever against Firestore.
        console.log(
          `[SyncQueue] Operation ${op.opId} (${op.operationType}) has no Supabase table; kept locally only.`
        );
        break;
      }

      default: {
        console.warn(`[SyncQueue] Unknown operation type: ${(op as any).operationType}`);
      }
    }
  }

  /**
   * Validate if cached offline authorization is still valid
   */
  public isOfflineAuthorized(lastOnlineAuthTime?: string): boolean {
    if (!lastOnlineAuthTime) return true; // Graceful default
    const lastTime = new Date(lastOnlineAuthTime).getTime();
    if (isNaN(lastTime)) return true;
    const now = Date.now();
    return now - lastTime <= MAX_OFFLINE_GRACE_PERIOD_MS;
  }
}

export const syncQueueService = new SyncQueueService();
