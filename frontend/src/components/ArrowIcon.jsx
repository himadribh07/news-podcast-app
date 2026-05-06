import React from 'react';

export default function ArrowIcon({
  direction = 'right',
  size = 18,
  className = '',
}) {
  const isLeft = direction === 'left';

  return (
    <>
      <svg
        className={`sig-arrow-icon ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isLeft ? (
          <>
            <path d="M19 12H5" />
            <path d="M11 5l-7 7 7 7" />
          </>
        ) : (
          <>
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </>
        )}
      </svg>

      <style>{`
        .sig-arrow-icon {
          color: var(--accent);
          flex-shrink: 0;
          transform: translateY(0.5px);
          transition: transform 0.15s ease;
        }

        .sig-arrow-icon.sig-arrow-icon--left {
          color: inherit;
        }

        .sig-btn--viewall:hover .sig-arrow-icon,
        .sig-btn--archive:hover .sig-arrow-icon {
          transform: translateX(2px) translateY(0.5px);
        }

        .sig-btn--back:hover .sig-arrow-icon--left {
          transform: translateX(-2px) translateY(0.5px);
        }
      `}</style>
    </>
  );
}