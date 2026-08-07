import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export default function FeatureCard({
  title,
  description,
  href,
  icon: Icon,
}: Props) {
  return (
    <Link
      href={href}
      className="
        flex min-h-40 flex-col
        rounded-3xl border border-[#dfe7e2]
        bg-white p-5
        transition active:scale-[0.99]
      "
    >
      <div
        className="
          mb-4 flex h-12 w-12
          items-center justify-center
          rounded-2xl bg-[#eef8f1]
        "
      >
        <Icon
          size={27}
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>

      <h2 className="text-lg font-bold">
        {title}
      </h2>

      <p className="mt-1 text-sm leading-5 text-[#526158]">
        {description}
      </p>
    </Link>
  );
}
