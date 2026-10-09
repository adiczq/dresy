"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

import type { AdminOrderRow } from "@/lib/admin-orders";

type Props = {
  row: AdminOrderRow;
  onClose: () => void;
  onDeleted: (playerKey: string) => void;
};

export default function PlayerDeleteDialog({ row, onClose, onDeleted }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmedPaid, setConfirmedPaid] = useState(false);

  const paid = row.paymentStatus === "paid";

  async function handleDelete() {
    if (saving || (paid && !confirmedPaid)) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/players/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: row.orderId,
          playerIndex: row.playerIndex,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Nie udało się usunąć zawodnika.");
      }

      onDeleted(row.playerKey);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wystąpił błąd podczas usuwania.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-player-title"
        className="w-full max-w-md rounded-3xl border border-white/15 bg-club-surface p-6 text-white shadow-2xl md:p-8"
      >
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-400/10 text-red-300">
            <AlertTriangle size={26} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Zamknij"
            className="rounded-lg p-2 text-white/50 hover:bg-white/10 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="delete-player-title" className="text-xl font-black">
          Usunąć zawodnika?
        </h2>

        <p className="mt-3 text-sm leading-7 text-white/60">
          Czy na pewno chcesz usunąć zawodnika
          <strong className="text-white"> {row.playerName}</strong> z listy
          zamówień?
        </p>

        <div className="mt-5 rounded-xl border border-white/10 bg-club-bg p-4">
          <p className="text-sm font-bold">{row.playerName}</p>

          <p className="mt-1 text-xs text-white/50">{row.group}</p>

          <p className="mt-3 text-xs leading-6 text-white/50">
            Usunięte zostaną wszystkie produkty tego zawodnika. Zamówienia
            innych zawodników, również jego rodzeństwa, pozostaną bez zmian.
          </p>
        </div>

        {paid && (
          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4">
            <p className="text-sm font-bold text-amber-300">
              Uwaga — oznaczono jako zapłacone!
            </p>

            <p className="mt-2 text-xs leading-6 text-amber-100/70">
              Przed usunięciem upewnij się, że płatność została prawidłowo
              rozliczona.
            </p>

            <label className="mt-3 flex cursor-pointer items-start gap-3 text-xs text-white/80">
              <input
                type="checkbox"
                checked={confirmedPaid}
                onChange={(event) => setConfirmedPaid(event.target.checked)}
                disabled={saving}
                className="mt-0.5 h-4 w-4 shrink-0 accent-club-accent"
              />
              Potwierdzam sprawdzenie płatności.
            </label>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <p className="mt-5 text-xs leading-6 text-white/40">
          Dane zostaną zachowane w bazie jako archiwalne i nie będą widoczne na
          liście trenerów.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10 disabled:opacity-40"
          >
            Anuluj
          </button>

          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={saving || (paid && !confirmedPaid)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={16} />
            {saving ? "Usuwanie..." : "Tak, usuń"}
          </button>
        </div>
      </div>
    </div>
  );
}
