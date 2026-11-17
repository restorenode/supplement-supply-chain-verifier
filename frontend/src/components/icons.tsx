import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; weight?: number };

function Svg({ size = 16, weight = 1.8, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Svg weight={2.2} {...p}>
    <path d="M3.5 8.5l3 3 6-7" />
  </Svg>
);

export const XIcon = (p: IconProps) => (
  <Svg weight={2.2} {...p}>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg weight={2} {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.8v3.4l2.2 1.4" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg weight={1.6} {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5l3 3" />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg weight={1.7} {...p}>
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </Svg>
);

export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.5l6 11H2z" />
    <path d="M8 7v2.6" />
    <path d="M8 11.6v.1" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Svg>
);

export const ExternalIcon = (p: IconProps) => (
  <Svg weight={1.6} {...p}>
    <path d="M6.5 3.5h-3v9h9v-3M9 3.5h3.5V7M12.5 3.5L7 9" />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg weight={1.6} {...p}>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M3 10.5v-7a1 1 0 0 1 1-1h7" />
  </Svg>
);

export const UploadIcon = (p: IconProps) => (
  <Svg weight={1.5} {...p}>
    <path d="M8 10.5V3M5 6l3-3 3 3" />
    <path d="M3 10.5v2.5h10v-2.5" />
  </Svg>
);

export const InfoDotIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="3" />
  </Svg>
);

export const ThemeIcon = (p: IconProps) => (
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
    <circle cx="10" cy="10" r="7" />
    <path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" stroke="none" />
  </svg>
);
