import { assetPath } from "@/lib/asset";

export function YanceMark({ className }: { className?: string }) {
  return (
    <img
      className={className}
      src={assetPath("/brand/yance-mark.png")}
      alt=""
      width={64}
      height={64}
    />
  );
}
