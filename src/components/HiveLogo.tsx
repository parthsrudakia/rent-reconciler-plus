import React from 'react';

interface HiveLogoProps {
  className?: string;
}

export const HiveLogo: React.FC<HiveLogoProps> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon */}
      <div className="flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 48 48" className="w-12 h-12">
          {/* Flower petals */}
          <g transform="translate(24,24)">
            {/* Top petal - yellow */}
            <ellipse cx="0" cy="-12" rx="4" ry="10" fill="#FDE047" transform="rotate(0)" />
            {/* Top right petal - black */}
            <ellipse cx="8.5" cy="-8.5" rx="4" ry="10" fill="#000000" transform="rotate(45)" />
            {/* Right petal - yellow */}
            <ellipse cx="12" cy="0" rx="4" ry="10" fill="#FDE047" transform="rotate(90)" />
            {/* Bottom right petal - black */}
            <ellipse cx="8.5" cy="8.5" rx="4" ry="10" fill="#000000" transform="rotate(135)" />
            {/* Bottom petal - yellow */}
            <ellipse cx="0" cy="12" rx="4" ry="10" fill="#FDE047" transform="rotate(180)" />
            {/* Bottom left petal - black */}
            <ellipse cx="-8.5" cy="8.5" rx="4" ry="10" fill="#000000" transform="rotate(225)" />
            {/* Left petal - yellow */}
            <ellipse cx="-12" cy="0" rx="4" ry="10" fill="#FDE047" transform="rotate(270)" />
            {/* Top left petal - black */}
            <ellipse cx="-8.5" cy="-8.5" rx="4" ry="10" fill="#000000" transform="rotate(315)" />
            
            {/* Center bee body */}
            <ellipse cx="0" cy="0" rx="3" ry="6" fill="#000000" />
            <rect x="-3" y="-2" width="6" height="1" fill="#FDE047" />
            <rect x="-3" y="1" width="6" height="1" fill="#FDE047" />
          </g>
        </svg>
      </div>
      
      {/* Text */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-black tracking-wider text-foreground">HIVE</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">New York Living</span>
          <span className="px-2 py-0.5 bg-yellow-400 text-black text-sm font-medium rounded">
            Made Simple
          </span>
        </div>
      </div>
    </div>
  );
};