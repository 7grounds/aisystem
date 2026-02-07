/**
 * @MODULE_ID shared.tools.yuh-connector
 * @STAGE global
 * @DATA_INPUTS ["action", "amount", "currency"]
 * @REQUIRED_TOOLS []
 */
"use client";

import { getButtonClasses } from "@/shared/components/Button";

type YuhConnectorProps = {
  action: "connect" | "transfer" | "portfolio";
  amount?: number;
  currency?: string;
  label?: string;
  className?: string;
};

const buildYuhDeepLink = ({
  action,
  amount,
  currency,
}: Pick<YuhConnectorProps, "action" | "amount" | "currency">) => {
  const params = new URLSearchParams();
  if (amount !== undefined) {
    params.set("amount", String(amount));
  }
  if (currency) {
    params.set("currency", currency);
  }

  const query = params.toString();
  return `yuh://${action}${query ? `?${query}` : ""}`;
};

export const YuhConnector = ({
  action,
  amount,
  currency,
  label = "Open Yuh",
  className,
}: YuhConnectorProps) => {
  const href = buildYuhDeepLink({ action, amount, currency });

  return (
    <a
      className={getButtonClasses("action", "md", className)}
      href={href}
    >
      {label}
    </a>
  );
};
