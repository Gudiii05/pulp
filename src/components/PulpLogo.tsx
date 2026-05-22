interface PulpLogoProps {
  size?: number;
  className?: string;
}

export default function PulpLogo({ size = 24, className }: PulpLogoProps) {
  return (
    <img
      src="/appicon.png"
      width={size}
      height={size}
      className={className}
      alt=""
      draggable={false}
    />
  );
}
