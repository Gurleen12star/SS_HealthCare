import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function AppButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: Props) {
  const styles =
    variant === "primary"
      ? "bg-[#176b4d] text-white"
      : "bg-white text-[#17211b] border border-[#dfe7e2]";

  return (
    <button
      {...props}
      className={`
        min-h-14 w-full rounded-2xl
        px-5 py-4 text-base font-semibold
        transition active:scale-[0.99]
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${styles}
        ${className}
      `}
    >
      {children}
    </button>
  );
}
