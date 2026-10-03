import Image from "next/image";

export default function Logo({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image
        src="/images/logo/heavenection-logo.png"
        alt="Heavenection"
        width={iconOnly ? 32 : 40}
        height={iconOnly ? 32 : 40}
        className="h-auto flex-shrink-0 rounded-sm"
        priority
      />
      {!iconOnly && <span className="text-xl font-bold">Heavenection</span>}
    </span>
  );
}
