import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ShoppingBag,
} from "lucide-react";

import { getPlayerInitials } from "@/lib/initials";
import { PRODUCTS, formatPrice, getLinePrice, getOrderPrice } from "@/lib/products";
import type { OrderPlayer } from "./types";

type Props = {
  players: OrderPlayer[];
  parentName: string;
  showPreview: boolean;
  isSaving: boolean;
  saveError: string;
  copyStatus: string;
  copySummary: () => void;
  saveOrder: () => Promise<void>;
};

export default function OrderSummary({
  players,
  parentName,
  showPreview,
  isSaving,
  saveError,
  copyStatus,
  copySummary,
  saveOrder,
}: Props) {
  return (
    <aside className="rounded-3xl border border-club-accent/20 bg-club-surface p-6 lg:sticky lg:top-28">
      <div className="mb-5 flex items-center gap-3">
        <ClipboardCheck size={23} className="text-club-accent" />
        <h3 className="text-xl font-black">Podsumowanie</h3>
      </div>

      {showPreview ? (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-club-accent">
            <CheckCircle2 size={19} />
            Gotowe do zapisania
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-club-bg/60 p-5 text-sm">
            {players.map((player, index) => (
              <div
                key={index}
                className="space-y-2 border-b border-white/10 pb-4 last:border-0 last:pb-0"
              >
                <p className="font-bold text-white">{player.playerName}</p>

                <p className="text-white/65">Grupa: {player.group}</p>

                <p className="text-white/65">
                  Inicjały:{" "}
                  {player.noInitials
                    ? "Bez inicjałów"
                    : getPlayerInitials(player.playerName)}
                </p>

                {player.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-wrap justify-between gap-2 text-white/70"
                  >
                    <span>{PRODUCTS[item.productId].shortLabel} · {item.size}</span>
                    <strong className="text-club-accent">{formatPrice(getLinePrice(item))}</strong>
                  </div>
                ))}
                <p className="text-right text-xs font-semibold text-white/65">
                  Za zawodnika: {formatPrice(player.items.reduce((sum, item) => sum + getLinePrice(item), 0))}
                </p>
              </div>
            ))}

            <p className="pt-2 text-white/55">Opiekun: {parentName}</p>
            <p className="flex items-center justify-between gap-2 border-t border-white/15 pt-4 font-black">
              <span>Łącznie do zapłaty</span>
              <span className="text-lg text-club-accent">{formatPrice(getOrderPrice(players))}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={copySummary}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            <Copy size={17} />
            Kopiuj podsumowanie
          </button>

          {copyStatus && (
            <p role="status" className="text-xs text-white/60">
              {copyStatus}
            </p>
          )}

          <button
            type="button"
            onClick={saveOrder}
            disabled={isSaving}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-club-primary px-6 py-4 text-sm font-extrabold text-club-on-primary hover:bg-club-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Zapisywanie..." : "Zapisz zgłoszenie"}
            <ArrowRight size={18} />
          </button>

          {saveError && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs leading-6 text-red-200"
            >
              {saveError}
            </p>
          )}

          <p className="text-xs leading-6 text-white/45">
            To podgląd. Zgłoszenie trafi do klubu dopiero po zapisaniu.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-club-bg/50 p-6 text-center">
          <ShoppingBag
            size={42}
            strokeWidth={1.3}
            className="mx-auto mb-4 text-club-accent/50"
          />

          <p className="text-sm leading-7 text-white/55">
            Uzupełnij dane, a następnie kliknij „Sprawdź zgłoszenie”.
          </p>
          <p className="mt-4 text-sm font-semibold text-white/70">
            Wartość wybranych produktów
          </p>
          <p className="mt-1 text-2xl font-black text-club-accent">
            {formatPrice(getOrderPrice(players))}
          </p>
        </div>
      )}
    </aside>
  );
}
