/**
 * @MODULE_ID shared.tools.fee-calculator
 * @STAGE global
 * @DATA_INPUTS ["amount"]
 * @REQUIRED_TOOLS []
 */
"use client";

import { useMemo, useState } from "react";

const parseAmount = (value: string) => {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value: number) => {
  return `CHF ${value.toFixed(2)}`;
};

export const FeeCalculator = () => {
  const [amountInput, setAmountInput] = useState("1000");

  const amount = useMemo(() => parseAmount(amountInput), [amountInput]);
  const yuhFee = useMemo(() => Math.max(1, amount * 0.0095), [amount]);
  const referenceFee = useMemo(() => amount * 0.02 + 15, [amount]);
  const maxFee = Math.max(yuhFee, referenceFee, 1);

  const yuhWidth = Math.min(100, Math.round((yuhFee / maxFee) * 100));
  const referenceWidth = Math.min(
    100,
    Math.round((referenceFee / maxFee) * 100),
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.22em] text-slate-400">
          Investment Amount (CHF)
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-emerald-400 focus:outline-none"
          onChange={(event) => setAmountInput(event.target.value)}
          placeholder="CHF 1,000"
          type="text"
          value={amountInput}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Yuh Fee</span>
          <span className="text-emerald-500">{formatCurrency(yuhFee)}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200/70">
          <div
            className="h-2 rounded-full bg-emerald-500"
            style={{ width: `${yuhWidth}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>Reference Fee</span>
          <span className="text-rose-400">
            {formatCurrency(referenceFee)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200/70">
          <div
            className="h-2 rounded-full bg-rose-400"
            style={{ width: `${referenceWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
};
