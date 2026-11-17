import { supabase } from '../lib/supabase';
import type { TeamInvitation, TeamMember, TeamPermissions, TeamRole } from '../types';

/**
 * Supabase-native team invitations.
 *
 * Replaces the dead /api/team/* flow (server.ts is never deployed — the
 * Vercel build is static, so every /api fetch returned index.html).
 * No email is sent by this service: the owner shares the invitation link
 * (built by buildInvitationLink) with the staff member manually.
 *
 * Table: public.team_invitations
 *   id TEXT PK, owner_id TEXT -> users(id), email TEXT, role TEXT,
 *   token TEXT UNIQUE, status TEXT (pending/accepted/revoked/expired),
 *   created_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
 *   accepted_by TEXT, accepted_at TIMESTAMPTZ
 * (see supabase/migration-2026-11-17-audit-fixes.sql)
 *
 * NOTE: the table stores no invitee name/phone/permissions — those live on
 * the owner's local TeamMember record (TeamManagementView). The invitee's
 * display name is derived from their email until they accept and supply
 * their own name.
 */

export const INVITATION_TTL_DAYS = 7;

export interface TeamInvitationRow {
  id: string;
  owner_id: string;
  email: string;
  role: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  created_at: string;
  expires_at: string | null;
  accepted_by: string | null;
  accepted_at: string | null;
}

export type InvitationListItem = TeamInvitation & { token: string };

export interface InvitationDetails {
  valid: boolean;
  id?: string;
  ownerId?: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked' | 'not_found';
  storeName?: string;
  invitedEmail?: string;
  /** Display name — derived from the email, the table stores no name. */
  name?: string;
  role?: string;
  invitedByName?: string;
  expiresAt?: string;
  error?: string;
}

export interface AcceptInvitationOptions {
  name?: string;
  email?: string;
  phone?: string;
  permissions?: Partial<TeamPermissions>;
}

/** Shareable link the owner sends to the invitee. App.tsx routes ?token= to AcceptInvitationView. */
export const buildInvitationLink = (token: string): string => {
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://yearinvo.vercel.app';
  return `${origin}/?token=${encodeURIComponent(token)}`;
};

const emailLocalPart = (email: string): string => {
  const local = (email || '').split('@')[0] || 'Team Member';
  return local.replace(/[._-]+/g, ' ').trim() || 'Team Member';
};

const toListItem = (row: TeamInvitationRow): InvitationListItem => ({
  id: row.id,
  storeId: row.owner_id,
  storeName: '',
  invitedEmail: row.email,
  name: emailLocalPart(row.email),
  role: (row.role || 'Cashier') as TeamRole,
  invitedBy: row.owner_id,
  invitedByName: '',
  token: row.token,
  status: row.status,
  createdAt: row.created_at,
  expiresAt: row.expires_at || '',
  acceptedAt: row.accepted_at || undefined,
  acceptedByUid: row.accepted_by || undefined,
});

export const createInvitation = async (
  ownerId: string,
  email: string,
  role: string
): Promise<TeamInvitationRow> => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!ownerId || !cleanEmail) {
    throw new Error('Owner and a valid email address are required to create an invitation.');
  }
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // Token is UNIQUE — retry once with a fresh token on a (near-impossible) collision.
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = crypto.randomUUID();
    const { data, error } = await supabase
      .from('team_invitations')
      .insert({
        owner_id: ownerId,
        email: cleanEmail,
        role: role || 'Cashier',
        token,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (!error && data) return data as TeamInvitationRow;
    if (error?.code !== '23505') {
      throw new Error(error?.message || 'Could not create the invitation. Please try again.');
    }
  }
  throw new Error('Could not create the invitation — please try again.');
};

export const listInvitations = async (ownerId: string): Promise<InvitationListItem[]> => {
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message || 'Could not load invitations.');
  }
  return (data || []).map((row) => toListItem(row as TeamInvitationRow));
};

export const revokeInvitation = async (id: string): Promise<void> => {
  const { data, error } = await supabase
    .from('team_invitations')
    .update({ status: 'revoked' })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id');
  if (error) {
    throw new Error(error.message || 'Could not revoke the invitation.');
  }
  if (!data || data.length === 0) {
    throw new Error('This invitation can no longer be revoked (it may already be accepted or expired).');
  }
};

export const getInvitationByToken = async (token: string): Promise<InvitationDetails> => {
  if (!token) {
    return { valid: false, status: 'not_found', error: 'Invitation token is missing from the link.' };
  }
  const { data, error } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (error) {
    return { valid: false, status: 'not_found', error: error.message || 'Could not load this invitation.' };
  }
  const row = data as TeamInvitationRow | null;
  if (!row) {
    return { valid: false, status: 'not_found', error: 'Invitation not found. The link may be wrong or the invitation was deleted.' };
  }
  if (row.status !== 'pending') {
    return {
      valid: false,
      id: row.id,
      ownerId: row.owner_id,
      status: row.status,
      invitedEmail: row.email,
      name: emailLocalPart(row.email),
      role: row.role,
      expiresAt: row.expires_at || undefined,
    };
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    // Best-effort: mark it expired so the owner sees the real state.
    await supabase.from('team_invitations').update({ status: 'expired' }).eq('id', row.id).eq('status', 'pending');
    return {
      valid: false,
      id: row.id,
      ownerId: row.owner_id,
      status: 'expired',
      invitedEmail: row.email,
      name: emailLocalPart(row.email),
      role: row.role,
      expiresAt: row.expires_at,
    };
  }

  // Owner display details come from public.users (full_name / brand_name).
  let storeName: string | undefined;
  let invitedByName: string | undefined;
  try {
    const { data: owner } = await supabase
      .from('users')
      .select('full_name, brand_name')
      .eq('id', row.owner_id)
      .maybeSingle();
    storeName = owner?.brand_name || owner?.full_name || undefined;
    invitedByName = owner?.full_name || undefined;
  } catch {
    // Owner lookup is display-only; the invitation itself is still valid.
  }

  return {
    valid: true,
    id: row.id,
    ownerId: row.owner_id,
    status: 'pending',
    storeName,
    invitedEmail: row.email,
    name: emailLocalPart(row.email),
    role: row.role,
    invitedByName,
    expiresAt: row.expires_at || undefined,
  };
};

export const acceptInvitation = async (
  token: string,
  userId: string,
  opts: AcceptInvitationOptions = {}
): Promise<{ invitationId: string; ownerId: string }> => {
  if (!token || !userId) {
    throw new Error('Invitation token and user are required to accept an invitation.');
  }
  const details = await getInvitationByToken(token);
  if (!details.valid || !details.id || !details.ownerId || !details.invitedEmail) {
    if (details.status === 'expired') {
      throw new Error('Invitation expired. Please ask the store owner to send a new invitation.');
    }
    if (details.status === 'accepted') {
      throw new Error('This invitation has already been used.');
    }
    if (details.status === 'revoked') {
      throw new Error('This invitation is no longer valid.');
    }
    throw new Error(details.error || 'Invitation not found. The link may be wrong or the invitation was deleted.');
  }

  const memberName = (opts.name || '').trim() || emailLocalPart(details.invitedEmail);
  const memberEmail = (opts.email || details.invitedEmail).trim().toLowerCase();

  // Create the membership in public.team_members (owner_id = inviting store owner).
  // NOTE: the owner's TeamManagementView list is localStorage/Firestore-backed,
  // so this Supabase row is the durable membership record; it is not yet
  // merged into the owner's in-app member list (see report).
  const { error: memberError } = await supabase.from('team_members').insert({
    owner_id: details.ownerId,
    name: memberName,
    email: memberEmail,
    phone: opts.phone || null,
    role: (details.role || 'cashier').toLowerCase(),
    permissions: opts.permissions || {},
    status: 'active',
  });
  if (memberError) {
    throw new Error(memberError.message || 'Could not join the team. Please try again.');
  }

  // Mark the invitation accepted — guarded so a second accept cannot re-run.
  const { data: updated, error: updateError } = await supabase
    .from('team_invitations')
    .update({ status: 'accepted', accepted_by: userId, accepted_at: new Date().toISOString() })
    .eq('id', details.id)
    .eq('status', 'pending')
    .select('id');
  if (updateError) {
    throw new Error(updateError.message || 'Could not accept the invitation. Please try again.');
  }
  if (!updated || updated.length === 0) {
    throw new Error('This invitation has already been used.');
  }

  return { invitationId: details.id, ownerId: details.ownerId };
};

/**
 * Accepted team members for one store owner, read from public.team_members.
 *
 * acceptInvitation() inserts one row per accepted invitation (owner_id =
 * inviting store owner, role lowercased, status 'active'). The owner's
 * TeamManagementView list is Firestore/localStorage-backed, so it merges
 * these rows into that list by email — see TeamManagementView.
 *
 * Rows are returned as TeamMember objects with a stable `team-supabase-<id>`
 * id, so the view can target the same row again for delete/disable.
 * RLS: "Public & Auth Full Access team_members" (supabase/schema.sql:212)
 * allows the owner's client to select/update/delete these rows.
 */
export interface TeamMemberRow {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: Record<string, unknown> | null;
  status: string;
  created_at: string;
}

/** acceptInvitation() stores roles lowercased ('inventory manager', ...). */
const dbRoleToTeamRole = (dbRole: string): TeamRole => {
  switch ((dbRole || '').trim().toLowerCase()) {
    case 'owner':
      return 'Owner';
    case 'manager':
      return 'Manager';
    case 'cashier':
      return 'Cashier';
    case 'inventory manager':
    case 'inventory_manager':
      return 'Inventory Manager';
    case 'accountant':
      return 'Accountant';
    default:
      return 'Custom Role';
  }
};

export const listTeamMembers = async (ownerId: string): Promise<TeamMember[]> => {
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(error.message || 'Could not load team members.');
  }
  return (data || []).map((row) => {
    const r = row as TeamMemberRow;
    return {
      id: `team-supabase-${r.id}`,
      name: r.name,
      email: (r.email || '').toLowerCase(),
      phone: r.phone || undefined,
      role: dbRoleToTeamRole(r.role),
      status: 'Active',
      joinedDate: (r.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
      customPermissions: (r.permissions || {}) as unknown as Partial<TeamPermissions>,
    } as TeamMember;
  });
};

/** Delete one team_members row (owner deleting a member from their list). */
export const removeTeamMember = async (rowId: string): Promise<void> => {
  if (!rowId) return;
  const { error } = await supabase.from('team_members').delete().eq('id', rowId);
  if (error) {
    throw new Error(error.message || 'Could not remove the team member.');
  }
};

/** Flip one team_members row between 'active' and 'disabled'. */
export const updateTeamMemberStatus = async (
  rowId: string,
  status: 'active' | 'disabled'
): Promise<void> => {
  if (!rowId) return;
  const { error } = await supabase.from('team_members').update({ status }).eq('id', rowId);
  if (error) {
    throw new Error(error.message || 'Could not update the team member.');
  }
};
