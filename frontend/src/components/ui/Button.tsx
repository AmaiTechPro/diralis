import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "rounded-xl px-8 py-4 font-semibold transition duration-300";

  const styles = {
    primary:
      "bg-cyan-500 text-slate-950 hover:bg-cyan-400 hover:-translate-y-1 shadow-lg shadow-cyan-500/30",

    secondary:
      "border border-slate-700 bg-slate-900 hover:border-cyan-400 hover:bg-slate-800",
  };

  return (
    <button
      className={`${base} ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

