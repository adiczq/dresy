"use client";

import type { AdminOrderRow } from "@/lib/admin-orders";

import { Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/products";

type Props = {
  onDelete: (row: AdminOrderRow) => void;
  onEdit: (row: AdminOrderRow) => void;
  rows: AdminOrderRow[];
  savingKey: string | null;
  onPaymentChange: (row: AdminOrderRow, paid: boolean) => void | Promise<void>;
};

type ClothingItem = {
  size: string;
  quantity: number;
  unitPrice: number | null;
};

type PlayerRow = {
  key: string;
  source: AdminOrderRow;
  tracksuit?: ClothingItem;
  jacket?: ClothingItem;
  basicJacket?: ClothingItem;
  total: number;
  hasUnpriced: boolean;
};

function groupByPlayer(rows: AdminOrderRow[]): PlayerRow[] {
  const grouped = new Map<string, PlayerRow>();

  for (const row of rows) {
    let player = grouped.get(row.playerKey);

    if (!player) {
      player = {
        key: row.playerKey,
        source: row,
        total: 0,
        hasUnpriced: false,
      };

      grouped.set(row.playerKey, player);
    }

    const clothing = {
      size: row.size,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    };

    if (row.unitPrice === null) {
      player.hasUnpriced = true;
    } else {
      player.total += row.unitPrice * row.quantity;
    }

    if (row.productId === "tracksuit") {
      player.tracksuit = clothing;
    }

    if (row.productId === "jacket") {
      player.jacket = clothing;
    }
    if (row.productId === "jacket_basic") {
      player.basicJacket = clothing;
    }
  }

  return [...grouped.values()];
}

function ClothingCell({ item }: { item?: ClothingItem }) {
  if (!item) {
    return <span className="text-white/25">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-black text-club-accent">{item.size}</span>

      {item.quantity > 1 && (
        <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-white/60">
          ×{item.quantity}
        </span>
      )}
    </div>
  );
}

export default function PlayersTable({
  rows,
  savingKey,
  onPaymentChange,
  onEdit,
  onDelete,
}: Props) {
  const players = groupByPlayer(rows);

  return (
    <table className="w-full min-w-[1240px] text-left text-sm">
      <thead className="bg-club-elevated text-xs text-white/45">
        <tr>
          <th className="px-5 py-4">Zawodnik</th>
          <th className="px-5 py-4">Grupa</th>
          <th className="px-5 py-4">Dres</th>
          <th className="px-5 py-4">Kurtka Joma</th>
          <th className="px-5 py-4">Kurtka ekonomiczna</th>
          <th className="px-5 py-4">Kwota</th>
          <th className="px-5 py-4">Inicjały</th>
          <th className="px-5 py-4">Płatność</th>
          <th className="px-5 py-4">Kontakt</th>
          <th className="px-5 py-4 text-right">Akcje</th>
        </tr>
      </thead>

      <tbody>
        {players.map((player) => {
          const row = player.source;

          const paid = row.paymentStatus === "paid";
          const saving = savingKey === player.key;

          return (
            <tr
              key={player.key}
              className="border-t border-white/10 transition-colors hover:bg-white/[0.03]"
            >
              <td className="px-5 py-5">
                <div className="font-bold whitespace-nowrap">
                  {row.playerName}
                </div>
              </td>

              <td className="px-5 py-5 text-white/65">{row.group}</td>

              <td className="px-5 py-5">
                <ClothingCell item={player.tracksuit} />
              </td>

              <td className="px-5 py-5">
                <ClothingCell item={player.jacket} />
              </td>

              <td className="px-5 py-5">
                <ClothingCell item={player.basicJacket} />
              </td>

              <td className="px-5 py-5 whitespace-nowrap font-semibold text-club-accent"
                  title={player.hasUnpriced ? "Starsze zamówienie nie ma zapisanych cen" : undefined}>
                {player.hasUnpriced ? "—" : formatPrice(player.total)}
              </td>

              <td className="px-5 py-5">
                {row.initials ? (
                  <span className="inline-flex rounded-lg border border-club-accent/20 bg-club-accent/10 px-3 py-2 text-xs font-black tracking-wider text-club-accent">
                    {row.initials}
                  </span>
                ) : (
                  <span className="text-xs text-white/40">Bez inicjałów</span>
                )}
              </td>

              <td className="px-5 py-5">
                <label className="inline-flex cursor-pointer items-center gap-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={paid}
                    disabled={savingKey !== null}
                    onChange={(event) =>
                      void onPaymentChange(row, event.target.checked)
                    }
                    aria-label={`Zapłacono za odzież: ${row.playerName}`}
                    className="h-4 w-4 shrink-0 cursor-pointer accent-club-success disabled:cursor-wait"
                  />

                  <span
                    className={`text-xs font-bold ${
                      paid ? "text-club-success" : "text-amber-300"
                    }`}
                  >
                    {saving
                      ? "Zapisywanie..."
                      : paid
                        ? "Zapłacono"
                        : "Oczekuje"}
                  </span>
                </label>
              </td>

              <td className="px-5 py-5">
                <p className="font-medium whitespace-nowrap">
                  {row.parentName}
                </p>

                <p className="mt-1 text-xs text-white/45">{row.phone}</p>
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    aria-label={`Edytuj zawodnika ${row.playerName}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 transition hover:border-club-accent hover:text-club-accent"
                  >
                    <Pencil size={15} />
                    Edytuj
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(row)}
                    aria-label={`Usuń zawodnika ${row.playerName}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-xs font-semibold text-red-300 transition hover:border-red-400/60 hover:bg-red-400/10"
                  >
                    <Trash2 size={15} />
                    Usuń
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
