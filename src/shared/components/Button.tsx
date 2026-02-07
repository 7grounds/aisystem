/**
 * @MODULE_ID shared.components.button
 * @STAGE global
 * @DATA_INPUTS ["variant", "size"]
 * @REQUIRED_TOOLS []
 */
"use client";

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "success" | "action";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70";

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  success: "bg-emerald-500 text-slate-900 hover:bg-emerald-400",
  action: "bg-rose-500 text-white hover:bg-rose-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export const getButtonClasses = (
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) => {
  return [baseStyles, variantStyles[variant], sizeStyles[size], className]
    .filter(Boolean)
    .join(" ");
};

export const Button = ({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) => {
  return (
    <button
      className={getButtonClasses(variant, size, className)}
      type={type}
      {...props}
    />
  );
};
