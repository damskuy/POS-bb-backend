"use client";

import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Invoice, PaymentMethod, PaymentStatus } from "@/types/invoice";
import { PaymentService } from "@/services/payment.service";
import { formatRupiah } from "@/utils/format";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Tunai (Cash)",
  QRIS: "QRIS",
  TRANSFER: "Transfer Bank",
  EWALLET: "E-Wallet",
};

const formatNumberWithDots = (val: string | number): string => {
  if (val === "" || val === null || val === undefined) return "";
  const numStr = String(val).replace(/\D/g, "");
  if (!numStr) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numStr));
};

const parseDotsToNumber = (val: string): number => {
  const numStr = String(val).replace(/\D/g, "");
  return numStr ? Number(numStr) : 0;
};

const schema = z.object({
  amount: z
    .number({ message: "Nominal harus berupa angka" })
    .positive("Nominal harus lebih dari 0"),
  method: z.enum(["CASH", "QRIS", "TRANSFER", "EWALLET"]),
  referenceNumber: z.string().optional(),
});

type FormData = {
  amount: string;
  method: PaymentMethod;
  referenceNumber: string;
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const total = invoice.grandTotal;
  const alreadyPaid = invoice.payment?.amount ?? 0;
  const remaining = Math.max(0, total - alreadyPaid);
  const existingPayment = invoice.payment;

  const [formData, setFormData] = useState<FormData>({
    amount: remaining > 0 ? formatNumberWithDots(remaining) : "",
    method: "CASH",
    referenceNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: remaining > 0 ? formatNumberWithDots(remaining) : "",
        method: existingPayment?.method ?? "CASH",
        referenceNumber: existingPayment?.referenceNumber ?? "",
      });
      setErrors({});
      setServerError("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError("");
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    const formatted = rawVal ? formatNumberWithDots(rawVal) : "";
    setFormData((prev) => ({ ...prev, amount: formatted }));
    if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }));
    if (serverError) setServerError("");
  };

  const calculatePaymentResult = (inputVal: number, method: PaymentMethod) => {
    const isCash = method === "CASH";
    const effectiveInput = isCash ? Math.min(inputVal, remaining) : inputVal;

    let finalAmount: number;
    if (!existingPayment) {
      finalAmount = Math.min(total, effectiveInput);
    } else {
      if (effectiveInput >= remaining) {
        finalAmount = total;
      } else {
        finalAmount = Math.min(total, existingPayment.amount + effectiveInput);
      }
    }

    const status: PaymentStatus = finalAmount >= total ? "PAID" : finalAmount > 0 ? "PARTIAL" : "UNPAID";
    const change = isCash && inputVal > remaining ? inputVal - remaining : 0;

    return {
      finalAmount,
      status,
      remainingAfter: Math.max(0, total - finalAmount),
      change,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseDotsToNumber(formData.amount);
    const result = schema.safeParse({
      amount: parsedAmount || undefined,
      method: formData.method,
      referenceNumber: formData.referenceNumber || undefined,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const inputAmount = result.data.amount;

    // Validate non-cash payment cannot exceed remaining
    if (formData.method !== "CASH" && inputAmount > remaining) {
      setErrors({ amount: `Nominal pembayaran non-tunai tidak boleh melebihi sisa tagihan (${formatRupiah(remaining)})` });
      return;
    }

    const { finalAmount, status } = calculatePaymentResult(inputAmount, formData.method);
    const paidAt = new Date().toISOString();

    setSubmitting(true);
    try {
      if (existingPayment) {
        // Update existing payment
        await PaymentService.updatePayment(existingPayment.id, {
          amount: finalAmount,
          method: result.data.method,
          status,
          referenceNumber: result.data.referenceNumber ?? null,
          paidAt,
        });
      } else {
        // Create new payment
        await PaymentService.createPayment({
          workOrderId: invoice.workOrderId,
          amount: finalAmount,
          method: result.data.method,
          status,
          referenceNumber: result.data.referenceNumber ?? null,
          paidAt,
        });
      }
      onSuccess();
    } catch (err: any) {
      setServerError(err?.message || "Gagal memproses pembayaran. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const rawInput = parseDotsToNumber(formData.amount);
  const { status: previewStatus, remainingAfter: previewRemaining, change: previewChange } = calculatePaymentResult(rawInput, formData.method);
  const isCash = formData.method === "CASH";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl z-10 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {existingPayment ? "Update Pembayaran" : "Tambah Pembayaran"}
              </h3>
              <p className="text-xs text-slate-500">
                Invoice <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tagihan info */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Total</p>
              <p className="text-xs font-mono font-bold text-slate-900">{formatRupiah(total)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Terbayar</p>
              <p className="text-xs font-mono font-bold text-emerald-600">{formatRupiah(alreadyPaid)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium">Sisa Tagihan</p>
              <p className="text-xs font-mono font-bold text-rose-600">{formatRupiah(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {serverError}
            </div>
          )}

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nominal Diterima / Dibayarkan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-sm font-bold text-slate-400 pointer-events-none">Rp</span>
              <input
                type="text"
                inputMode="numeric"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder="0"
                autoFocus
                className={`w-full pl-10 pr-3.5 py-2.5 bg-white border rounded-xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? "border-rose-400 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-500/20"
                }`}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-rose-500 font-medium">{errors.amount}</p>}

            {/* Quick fill button */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleChange("amount", formatNumberWithDots(remaining))}
                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                Uang Pas ({formatRupiah(remaining)})
              </button>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Metode Pembayaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleChange("method", m)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                    formData.method === m
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${formData.method === m ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {METHOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* No. Referensi (optional) */}
          {(formData.method === "TRANSFER" || formData.method === "QRIS" || formData.method === "EWALLET") && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">No. Referensi / Bukti Transfer</label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => handleChange("referenceNumber", e.target.value)}
                placeholder="Contoh: TRF20240101001"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          )}

          {/* Change Display (Kembalian) for CASH */}
          {isCash && previewChange > 0 && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
              <div>
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Uang Kembalian</p>
                <p className="text-lg font-mono font-black text-emerald-700 mt-0.5">
                  {formatRupiah(previewChange)}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xs">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 00-2 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          )}

          {/* Preview status */}
          {rawInput > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="text-xs text-slate-500">
                <span>Status pembayaran: </span>
                <span className={`font-bold ${
                  previewStatus === "PAID" ? "text-emerald-600" :
                  previewStatus === "PARTIAL" ? "text-amber-600" : "text-rose-600"
                }`}>
                  {previewStatus === "PAID" ? "Lunas" : previewStatus === "PARTIAL" ? "Belum Lunas" : "Belum Dibayar"}
                </span>
              </div>
              {previewRemaining > 0 && (
                <span className="text-xs font-mono font-bold text-slate-500">
                  Sisa: {formatRupiah(previewRemaining)}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Pembayaran
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
