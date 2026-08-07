"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  House,
  UserRound,
  UsersRound,
} from "lucide-react";

const items = [
  {
    label: "Home",
    href: "/asha",
    icon: House,
  },
  {
    label: "Patients",
    href: "/asha/patients",
    icon: UsersRound,
  },
  {
    label: "Follow-ups",
    href: "/asha/followups",
    icon: Bell,
  },
  {
    label: "Profile",
    href: "/asha/profile",
    icon: UserRound,
  },
];

export default function AshaBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="
        fixed bottom-0 left-1/2 z-50
        flex w-full max-w-md
        -translate-x-1/2
        border-t border-[#dfe7e2]
        bg-white px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]
        pt-2
      "
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex min-h-14 flex-1
              flex-col items-center
              justify-center gap-1
              rounded-xl text-xs
              ${
                active
                  ? "font-bold text-[#176b4d]"
                  : "text-[#526158]"
              }
            `}
          >
            <Icon size={22} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
