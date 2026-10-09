"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Download, Shirt, Search, Users } from "lucide-react";
import PlayersTable from "@/components/admin/PlayersTable";
import type { AdminOrderRow } from "@/lib/admin-orders";
import PlayerDeleteDialog from "@/components/admin/PlayerDeleteDialog";
import PlayerEditDialog, {
  type PlayerEditUpdate,
} from "@/components/admin/PlayerEditDialog";

type Props = {
  ordersCount: number;
  rows: AdminOrderRow[];
};

const productNames = {
  tracksuit: "Dres Academy IV",
  jacket: "Kurtka",
};

const sizeOrder = ["6XS", "5XS", "4XS", "3XS", "2XS", "XS", "Do ustalenia"];

export default function OrdersDashboard({ ordersCount, rows }: Props) {
  const [selectedGroup, setSelectedGroup] = useState("all");

  const [search, setSearch] = useState("");

  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all",
  );

  const [displayRows, setDisplayRows] = useState<AdminOrderRow[]>(rows);

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [paymentError, setPaymentError] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [editingPlayerKey, setEditingPlayerKey] = useState<string | null>(null);

  const [deletingPlayerKey, setDeletingPlayerKey] = useState<string | null>(
    null,
  );

  const groups = useMemo(
    () =>
      [...new Set(displayRows.map((row) => row.group))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pl")),
    [displayRows],
  );

  const filteredRows = useMemo(() => {
    const phrase = search.trim().toLocaleLowerCase("pl-PL");

    return displayRows.filter((row) => {
      const matchesGroup =
        selectedGroup === "all" || row.group === selectedGroup;

      const matchesPayment =
        paymentFilter === "all" || row.paymentStatus === paymentFilter;

      const matchesSearch =
        !phrase ||
        [row.playerName, row.parentName, row.group]
          .join(" ")
          .toLocaleLowerCase("pl-PL")
          .includes(phrase);

      return matchesGroup && matchesPayment && matchesSearch;
    });
  }, [displayRows, selectedGroup, paymentFilter, search]);

  const playerCount = new Set(filteredRows.map((row) => row.playerKey)).size;

  const tracksuitCount = filteredRows
    .filter((row) => row.productId === "tracksuit")
    .reduce((sum, row) => sum + row.quantity, 0);

  const jacketCount = filteredRows
    .filter((row) => row.productId === "jacket")
    .reduce((sum, row) => sum + row.quantity, 0);

  const sizeTotals = useMemo(() => {
    const totals = new Map<
      string,
      {
        productId: AdminOrderRow["productId"];
        size: string;
        quantity: number;
      }
    >();

    for (const row of filteredRows) {
      const key = `${row.productId}:${row.size}`;
      const existing = totals.get(key);

      if (existing) {
        existing.quantity += row.quantity;
      } else {
        totals.set(key, {
          productId: row.productId,
          size: row.size,
          quantity: row.quantity,
        });
      }
    }

    return [...totals.values()].sort((a, b) => {
      if (a.productId !== b.productId) {
        return a.productId === "tracksuit" ? -1 : 1;
      }

      return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    });
  }, [filteredRows]);

  function handlePlayerDeleted(playerKey: string) {
    setDisplayRows((current) =>
      current.filter((row) => row.playerKey !== playerKey),
    );

    setDeletingPlayerKey(null);
  }

  function handlePlayerSaved(update: PlayerEditUpdate) {
    setDisplayRows((current) =>
      current.map((row) => {
        if (row.playerKey !== update.playerKey) {
          return row;
        }

        const size =
          row.productId === "tracksuit"
            ? (update.tracksuitSize ?? row.size)
            : (update.jacketSize ?? row.size);

        return {
          ...row,
          playerName: update.playerName,
          group: update.group,
          initials: update.initials,
          size,
        };
      }),
    );

    setEditingPlayerKey(null);
  }

  async function handlePaymentChange(row: AdminOrderRow, paid: boolean) {
    if (savingKey !== null) return;

    setSavingKey(row.playerKey);
    setPaymentError("");

    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: row.orderId,
          playerIndex: row.playerIndex,
          paid,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Nie udało się zaktualizować płatności.");
      }

      // Aktualizujemy wszystkie produkty tego zawodnika.
      setDisplayRows((current) =>
        current.map((item) =>
          item.playerKey === row.playerKey
            ? {
                ...item,
                paymentStatus: paid ? "paid" : "unpaid",
              }
            : item,
        ),
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Wystąpił problem z zapisaniem płatności.",
      );
    } finally {
      setSavingKey(null);
    }
  }

  async function handleExportExcel() {
    if (!filteredRows.length || exporting) return;

    setExporting(true);
    setExportError("");

    try {
      const { downloadOrdersExcel } = await import("@/lib/export-orders-excel");

      await downloadOrdersExcel(filteredRows);
    } catch (error) {
      console.error("Błąd eksportu Excel:", error);
      setExportError("Nie udało się przygotować pliku Excel.");
    } finally {
      setExporting(false);
    }
  }

  const deletingRow = deletingPlayerKey
    ? displayRows.find((row) => row.playerKey === deletingPlayerKey)
    : undefined;

  const activeOrderCount = new Set(displayRows.map((row) => row.orderId)).size;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Zawodnicy",
            value: playerCount,
            icon: Users,
          },
          {
            label: "Komplety dresowe",
            value: tracksuitCount,
            icon: Shirt,
          },
          {
            label: "Kurtki",
            value: jacketCount,
            icon: ClipboardList,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-club-surface p-6"
          >
            <Icon size={22} className="text-club-accent" />
            <p className="mt-5 text-3xl font-black">{value}</p>
            <p className="mt-2 text-sm text-white/50">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-club-surface">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-black">Lista dla trenerów</h2>
            <p className="mt-2 text-xs text-white/50">
              Aktywne zgłoszenia: {activeOrderCount}. Pobrano {ordersCount}{" "}
              zgłoszeń do analizy (maksymalnie 500 najnowszych).
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-white/40"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Szukaj zawodnika..."
                aria-label="Szukaj zawodnika"
                className="w-full rounded-xl border border-white/15 bg-club-bg py-3 pr-4 pl-11 text-sm text-white outline-none placeholder:text-white/35 focus:border-club-accent sm:w-56"
              />
            </div>

            <select
              aria-label="Filtruj według grupy"
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="rounded-xl border border-white/15 bg-club-bg px-4 py-3 text-sm text-white outline-none focus:border-club-accent"
            >
              <option value="all">Wszystkie grupy</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtruj według płatności"
              value={paymentFilter}
              onChange={(event) =>
                setPaymentFilter(
                  event.target.value as "all" | "paid" | "unpaid",
                )
              }
              className="rounded-xl border border-white/15 bg-club-bg px-4 py-3 text-sm text-white outline-none focus:border-club-accent"
            >
              <option value="all">Wszystkie płatności</option>
              <option value="paid">Zapłacono</option>
              <option value="unpaid">Oczekuje na wpłatę</option>
            </select>

            <button
              type="button"
              onClick={() => void handleExportExcel()}
              disabled={!filteredRows.length || exporting}
              className="flex items-center gap-2 rounded-xl bg-club-primary px-5 py-3 text-sm font-bold text-club-on-primary hover:bg-club-primary-hover disabled:opacity-40"
            >
              <Download size={17} />
              {exporting ? "Przygotowywanie..." : "Pobierz Excel"}
            </button>
          </div>
        </div>

        {exportError && (
          <p
            role="alert"
            className="mx-6 mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
          >
            {exportError}
          </p>
        )}

        {paymentError && (
          <p
            role="alert"
            className="mx-6 mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
          >
            {paymentError}
          </p>
        )}

        {filteredRows.length === 0 ? (
          <p className="p-8 text-center text-sm text-white/50">
            Brak zgłoszeń dla wybranej grupy.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <PlayersTable
              rows={filteredRows}
              savingKey={savingKey}
              onPaymentChange={handlePaymentChange}
              onEdit={(row) => setEditingPlayerKey(row.playerKey)}
              onDelete={(row) => setDeletingPlayerKey(row.playerKey)}
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-club-surface p-6">
        <h2 className="text-lg font-black">Podsumowanie rozmiarów</h2>

        <p className="mt-2 text-xs text-white/50">
          Łączna liczba sztuk w wybranej grupie.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sizeTotals.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-club-bg p-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  {productNames[item.productId]}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Rozmiar {item.size}
                </p>
              </div>

              <span className="text-2xl font-black text-club-accent">
                {item.quantity}
              </span>
            </div>
          ))}
        </div>
      </div>

      {editingPlayerKey && (
        <PlayerEditDialog
          rows={displayRows.filter((row) => row.playerKey === editingPlayerKey)}
          onClose={() => setEditingPlayerKey(null)}
          onSaved={handlePlayerSaved}
        />
      )}

      {deletingRow && (
        <PlayerDeleteDialog
          row={deletingRow}
          onClose={() => setDeletingPlayerKey(null)}
          onDeleted={handlePlayerDeleted}
        />
      )}
    </div>
  );
}
