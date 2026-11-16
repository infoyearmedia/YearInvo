import React from 'react';

interface MainWebsiteLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  customUrl?: string;
  siteName?: string;
  subName?: string;
}

export const MainWebsiteLogo: React.FC<MainWebsiteLogoProps> = ({
  className = '',
  size = 36,
  showText = false,
  customUrl = '',
  siteName = 'YearInvo',
  subName = 'by Year Media',
}) => {
  if (customUrl) {
    return (
      <div className={`inline-flex items-center gap-2.5 ${className}`}>
        <img
          src={customUrl}
          alt={siteName}
          style={{ width: size, height: size }}
          className="object-contain shrink-0 rounded-xl"
        />
        {showText && (
          <div className="flex flex-col">
            <span className="font-black tracking-tight leading-none text-slate-900 dark:text-white text-base">
              {siteName}
            </span>
            {subName && (
              <span className="text-[10px] font-extrabold text-[#ff5c01] tracking-wider uppercase mt-0.5">
                {subName}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official YearInvo logo supplied by Boss (public/logo.png) */}
      <img
        src="/logo.png"
        alt={siteName}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-2xl drop-shadow-md object-cover"
      />

      {showText && (
        <div className="flex flex-col">
          <span className="font-black tracking-tight leading-none text-slate-900 dark:text-white text-base">
            {siteName}
          </span>
          {subName && (
            <span className="text-[10px] font-extrabold text-[#ff5c01] tracking-wider uppercase mt-0.5">
              {subName}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
