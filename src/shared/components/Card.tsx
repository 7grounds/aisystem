/**
 * @MODULE_ID shared.components.card
 * @STAGE global
 * @DATA_INPUTS ["children"]
 * @REQUIRED_TOOLS []
 */
"use client";

import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
};
