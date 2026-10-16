"use client";

import type { AdminOrderRow } from "@/lib/admin-orders";
import { Pencil, Trash2 } from "lucide-react";
import { PACKAGES, formatPrice, type ProductId } from "@/lib/products";

type Props = {
  rows: AdminOrderRow[];
  savingKey: string | null;
  onPaymentChange: (row: AdminOrderRow, paid: boolean) => void | Promise<void>;
  onEdit: (row: AdminOrderRow) => void;
  onDelete: (row: AdminOrderRow) => void;
};

type GroupedPlayer = {
  row: AdminOrderRow;
  sizes: Partial<Record<ProductId, string>>;
  total: number;
  missingPrices: boolean;
};

function groupPlayers(rows: AdminOrderRow[]): GroupedPlayer[] {
  const byPlayer = new Map<string, GroupedPlayer>();
  for (const row of rows) {
    let player = byPlayer.get(row.playerKey);
    if (!player) {
      player = {
        row, sizes: {}, total: row.packageId ? row.packagePrice ?? 0 : 0,
        missingPrices: row.packageId ? row.packagePrice === null : false,
      };
      byPlayer.set(row.playerKey, player);
    }
    player.sizes[row.productId] = row.size;
    if (!row.packageId) {
      if (row.unitPrice === null) player.missingPrices = true;
      else player.total += row.unitPrice * row.quantity;
    }
  }
  return [...byPlayer.values()];
}

export default function PlayersTable({rows, savingKey, onPaymentChange, onEdit, onDelete}: Props) {
  return (
    <table className="w-full min-w-[1150px] text-left text-sm">
      <thead className="bg-club-elevated text-xs text-white/45">
        <tr>
          {[
            "Zawodnik", "Grupa", "Pakiet", "Spodnie", "Bluza", "Kurtka", "Kwota", "Inicjały", "Płatność", "Kontakt", "Akcje",
          ].map((heading) => <th key={heading} className="px-3 py-4">{heading}</th>)}
        </tr>
      </thead>
      <tbody>
        {groupPlayers(rows).map(({row, sizes, total, missingPrices}) => {
          const paid = row.paymentStatus === "paid";
          const saving = savingKey === row.playerKey;
          const jacket = sizes.jacket ? `II: ${sizes.jacket}` : sizes.jacket_basic ? `I: ${sizes.jacket_basic}` : "—";
          return (
            <tr key={row.playerKey} className="border-t border-white/10 transition-colors hover:bg-white/[0.03]">
              <td className="px-3 py-4 font-bold whitespace-nowrap">{row.playerName}</td>
              <td className="px-3 py-4 text-white/65">{row.group}</td>
              <td className="px-3 py-4 font-semibold text-club-accent whitespace-nowrap">{row.packageId ? PACKAGES[row.packageId].label : "Archiwalne"}</td>
              <td className="px-3 py-4 font-bold text-club-accent">{sizes.pants ?? sizes.tracksuit ?? "—"}</td>
              <td className="px-3 py-4 font-bold text-club-accent">{sizes.sweatshirt ?? "—"}</td>
              <td className="px-3 py-4 font-bold text-club-accent whitespace-nowrap">{jacket}</td>
              <td className="px-3 py-4 font-semibold text-club-accent whitespace-nowrap" title={missingPrices ? "Brak zapisanej ceny w starszym zgłoszeniu" : undefined}>{missingPrices ? "—" : formatPrice(total)}</td>
              <td className="px-3 py-4">{row.initials ?? "Bez inicjałów"}</td>
              <td className="px-3 py-4">
                <label className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap">
                  <input type="checkbox" checked={paid} disabled={savingKey !== null}
                    onChange={(event) => void onPaymentChange(row, event.target.checked)}
                    aria-label={`Zapłacono za odzież: ${row.playerName}`}
                    className="accent-club-success h-4 w-4 shrink-0 cursor-pointer disabled:cursor-wait"/>
                  <span className={`text-xs font-bold ${paid ? "text-club-success" : "text-amber-300"}`}>
                    {saving ? "Zapisywanie..." : paid ? "Zapłacono" : "Oczekuje"}
                  </span>
                </label>
              </td>
              <td className="px-3 py-4"><p className="font-medium whitespace-nowrap">{row.parentName}</p><p className="mt-1 text-xs text-white/45">{row.phone}</p></td>
              <td className="px-3 py-4">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => onEdit(row)} aria-label={`Edytuj zawodnika ${row.playerName}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-2 text-xs font-semibold text-white/75 transition hover:border-club-accent hover:text-club-accent"><Pencil size={14}/> Edytuj</button>
                  <button type="button" onClick={() => onDelete(row)} aria-label={`Usuń zawodnika ${row.playerName}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-400/20 px-2 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-400/10"><Trash2 size={14}/> Usuń</button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
