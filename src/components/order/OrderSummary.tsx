import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ShoppingBag,
} from "lucide-react";

import { PRODUCTS, PACKAGES, formatPrice, getOrderPrice } from "@/lib/products";
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
    <aside
      id="podsumowanie"
      className="border-club-accent/20 bg-club-surface scroll-mt-5 rounded-3xl border p-6 lg:sticky lg:top-28"
    >
      <div className="mb-5 flex items-center gap-3">
        <ClipboardCheck size={23} className="text-club-accent" />
        <h3 className="text-xl font-black">Podsumowanie</h3>
      </div>

      {showPreview ? (
        <div className="space-y-5">
          <div className="text-club-accent flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 size={19} />
            Gotowe do zapisania
          </div>

          <div className="bg-club-bg/60 space-y-4 rounded-2xl border border-white/10 p-5 text-sm">
            {players.map((player, index) => (
              <div
                key={index}
                className="space-y-2 border-b border-white/10 pb-4 last:border-0 last:pb-0"
              >
                <p className="font-bold text-white">{player.playerName}</p>

                <p className="text-white/65">Grupa: {player.group}</p>


                <p className="text-club-accent font-bold">
                  {PACKAGES[player.packageId].label}
                </p>
                {player.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex flex-wrap justify-between gap-2 text-white/70"
                  >
                    <span>{PRODUCTS[item.productId].shortLabel}</span>
                    <span className="font-semibold">{item.size}</span>
                  </div>
                ))}
                <p className="text-club-accent text-right text-sm font-bold">
                  Za zawodnika: {formatPrice(PACKAGES[player.packageId].price)}
                </p>
              </div>
            ))}

            <p className="pt-2 text-white/55">Opiekun: {parentName}</p>
            <p className="flex items-center justify-between gap-2 border-t border-white/15 pt-4 font-black">
              <span>Łącznie do zapłaty</span>
              <span className="text-club-accent text-lg">
                {formatPrice(getOrderPrice(players))}
              </span>
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
            className="bg-club-primary text-club-on-primary hover:bg-club-primary-hover flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="bg-club-bg/50 rounded-2xl border border-white/10 p-6 text-center">
          <ShoppingBag
            size={42}
            strokeWidth={1.3}
            className="text-club-accent/50 mx-auto mb-4"
          />

          <p className="text-sm leading-7 text-white/55">
            Uzupełnij dane, a następnie kliknij „Sprawdź zgłoszenie”.
          </p>
          <p className="mt-4 text-sm font-semibold text-white/70">
            Wartość wybranych produktów
          </p>
          <p className="text-club-accent mt-1 text-2xl font-black">
            {formatPrice(getOrderPrice(players))}
          </p>
        </div>
      )}
    </aside>
  );
}
