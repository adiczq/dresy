"use client";
import { ORDER_SIZES } from "@/lib/sizes";
import { useMemo, useState } from "react";
import {
  Download,
  Search,
  Users,
  Package,
  Layers3,
  Wallet,
  HandCoins,
  LockKeyhole,
  Hash,
} from "lucide-react";
import PlayersTable from "@/components/admin/PlayersTable";
import type { AdminOrderRow } from "@/lib/admin-orders";
import { PRODUCT_IDS, PRODUCTS, formatPrice } from "@/lib/products";
import PlayerDeleteDialog from "@/components/admin/PlayerDeleteDialog";
import PlayerEditDialog, {
  type PlayerEditUpdate,
} from "@/components/admin/PlayerEditDialog";
import { trainingGroups } from "@/lib/training-groups";

type Props = {
  ordersCount: number;
  rows: AdminOrderRow[];
};

const sizeOrder: readonly string[] = ORDER_SIZES;

export default function OrdersDashboard({ ordersCount, rows }: Props) {
  const [selectedGroup, setSelectedGroup] = useState("all");

  const [search, setSearch] = useState("");

  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all",
  );

  const [displayRows, setDisplayRows] = useState<AdminOrderRow[]>(rows);

  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [paymentError, setPaymentError] = useState("");
  const [numberingError, setNumberingError] = useState("");
  const [numberingBusy, setNumberingBusy] = useState(false);
  const [batchFilter, setBatchFilter] = useState("all");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const [editingPlayerKey, setEditingPlayerKey] = useState<string | null>(null);

  const [deletingPlayerKey, setDeletingPlayerKey] = useState<string | null>(
    null,
  );

  const groups = useMemo(
    () =>
      [
        ...new Set([
          ...trainingGroups.map((group) => group.value),
          ...displayRows.map((row) => row.group),
        ]),
      ].filter(Boolean),
    [displayRows],
  );

  const batchNumbers = [
    ...new Set(
      displayRows
        .map((row) => row.batchNumber)
        .filter((number): number is number => number !== null),
    ),
  ].sort((a, b) => a - b);

  const draftPlayers = new Set(
    displayRows.filter((row) => !row.approved).map((row) => row.playerKey),
  ).size;
  const unnumberedPlayers = new Set(
    displayRows
      .filter((row) => row.number === null)
      .map((row) => row.playerKey),
  ).size;

  async function handleNumberAction(action: "assign" | "approve") {
    if (numberingBusy) return;
    const prompt =
      action === "assign"
        ? `Nadać numery ${unnumberedPlayers} starszym zawodnikom? Istniejące zatwierdzone numery nie zostaną zmienione.`
        : `Zatwierdzić WSZYSTKIE ${draftPlayers} robocze zamówienia (niezależnie od filtrów)? Nie będzie można ich edytować ani usuwać. Płatności pozostaną dostępne.`;
    if (!window.confirm(prompt)) return;
    setNumberingBusy(true);
    setNumberingError("");
    try {
      const response = await fetch(`/api/admin/numbering/${action}`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        count?: number;
        assigned?: number;
      };
      if (!response.ok || !data.success)
        throw new Error(data.error ?? "Nie udało się wykonać operacji.");
      window.location.reload();
    } catch (error) {
      setNumberingError(
        error instanceof Error ? error.message : "Błąd numeracji.",
      );
      setNumberingBusy(false);
    }
  }

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

      const matchesBatch =
        batchFilter === "all" ||
        (batchFilter === "draft"
          ? !row.approved
          : row.batchNumber === Number(batchFilter));
      return matchesGroup && matchesPayment && matchesSearch && matchesBatch;
    });
  }, [displayRows, selectedGroup, paymentFilter, search, batchFilter]);

  const playerCount = new Set(filteredRows.map((row) => row.playerKey)).size;

  const uniquePlayers = [
    ...new Map(filteredRows.map((row) => [row.playerKey, row])).values(),
  ];
  const pricedTotal =
    filteredRows.reduce(
      (sum, row) =>
        sum + (row.packageId ? 0 : (row.unitPrice ?? 0) * row.quantity),
      0,
    ) +
    uniquePlayers.reduce(
      (sum, row) => sum + (row.packageId ? (row.packagePrice ?? 0) : 0),
      0,
    );
  const missingPrices = filteredRows.some((row) =>
    row.packageId ? row.packagePrice === null : row.unitPrice === null,
  );
  const packageOneCount = uniquePlayers.filter(
    (row) => row.packageId === "package_1",
  ).length;
  const packageTwoCount = uniquePlayers.filter(
    (row) => row.packageId === "package_2",
  ).length;

  const unpaidTotal =
    filteredRows.reduce((sum, row) => {
      if (row.packageId || row.paymentStatus === "paid") {
        return sum;
      }

      return sum + (row.unitPrice ?? 0) * row.quantity;
    }, 0) +
    uniquePlayers.reduce((sum, row) => {
      if (!row.packageId || row.paymentStatus === "paid") {
        return sum;
      }

      return sum + (row.packagePrice ?? 0);
    }, 0);

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
        return (
          PRODUCT_IDS.indexOf(a.productId) - PRODUCT_IDS.indexOf(b.productId)
        );
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
            : row.productId === "pants"
              ? (update.pantsSize ?? row.size)
              : row.productId === "sweatshirt"
                ? (update.sweatshirtSize ?? row.size)
                : row.productId === "jacket"
                  ? (update.jacketSize ?? row.size)
                  : (update.basicJacketSize ?? row.size);

        return {
          ...row,
          playerName: update.playerName,
          group: update.group,
          number: update.number,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            label: "Zawodnicy",
            value: playerCount,
            icon: Users,
            money: false,
          },
          {
            label: "Pakiet I",
            value: packageOneCount,
            icon: Package,
            money: false,
          },
          {
            label: "Pakiet II",
            value: packageTwoCount,
            icon: Layers3,
            money: false,
          },
          {
            label: "Wartość zamówień",
            value: pricedTotal,
            icon: Wallet,
            money: true,
          },
          {
            label: "Pozostało do zapłaty",
            value: unpaidTotal,
            icon: HandCoins,
            money: true,
          },
        ].map(({ label, value, icon: Icon, money }) => (
          <div
            key={label}
            className="bg-club-surface rounded-2xl border border-white/10 p-6"
          >
            <Icon size={22} strokeWidth={1.8} className="text-club-accent" />

            <p className="mt-5 text-3xl font-black">
              {money ? formatPrice(value) : value}
            </p>

            <p className="mt-2 text-sm text-white/50">{label}</p>
          </div>
        ))}
      </div>

      {missingPrices && (
        <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-xs leading-6 text-amber-100">
          Uwaga: starsze zgłoszenia nie mają zapisanych cen. Kwota w panelu i
          Excelu obejmuje wyłącznie produkty z potwierdzoną ceną z chwili
          zamówienia.
        </p>
      )}

      <div className="bg-club-surface rounded-2xl border border-white/10 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black">
              <Hash size={20} className="text-club-accent" /> Numeracja i partie
            </h2>
            <p className="mt-2 text-xs leading-6 text-white/50">
              Robocze: {draftPlayers} · Bez numeru: {unnumberedPlayers}.
              Zatwierdzenie blokuje edycję i usuwanie, ale pozwala nadal
              oznaczać wpłaty i przyjmować nowe zamówienia.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unnumberedPlayers > 0 && (
              <button
                type="button"
                disabled={numberingBusy}
                onClick={() => void handleNumberAction("assign")}
                className="border-club-accent/40 text-club-accent hover:bg-club-accent/10 rounded-xl border px-4 py-3 text-xs font-bold disabled:opacity-40"
              >
                Nadaj brakujące numery
              </button>
            )}
            <button
              type="button"
              disabled={
                numberingBusy || draftPlayers === 0 || unnumberedPlayers > 0
              }
              onClick={() => void handleNumberAction("approve")}
              className="bg-club-primary text-club-on-primary flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold disabled:opacity-40"
            >
              <LockKeyhole size={16} /> Zatwierdź partię
            </button>
          </div>
        </div>
        {numberingError && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {numberingError}
          </p>
        )}
      </div>

      <div className="bg-club-surface overflow-hidden rounded-2xl border border-white/10">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-black">Lista dla trenerów</h2>
            <p className="mt-2 text-xs text-white/50">
              Aktywne zgłoszenia: {activeOrderCount}. Pobrano {ordersCount}{" "}
              zgłoszeń do analizy (maksymalnie 1000 najnowszych). Do dostawcy
              wybierz jedną zatwierdzoną partię w filtrze.
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
                className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 py-3 pr-4 pl-11 text-sm text-white outline-none placeholder:text-white/35 sm:w-56"
              />
            </div>

            <select
              aria-label="Filtruj według grupy"
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="bg-club-bg focus:border-club-accent rounded-xl border border-white/15 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all">Wszystkie grupy</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtruj według partii"
              value={batchFilter}
              onChange={(event) => setBatchFilter(event.target.value)}
              className="bg-club-bg focus:border-club-accent rounded-xl border border-white/15 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all">Wszystkie partie</option>
              <option value="draft">Robocze</option>
              {batchNumbers.map((number) => (
                <option key={number} value={String(number)}>
                  Partia {number}
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
              className="bg-club-bg focus:border-club-accent rounded-xl border border-white/15 px-4 py-3 text-sm text-white outline-none"
            >
              <option value="all">Wszystkie płatności</option>
              <option value="paid">Zapłacono</option>
              <option value="unpaid">Oczekuje na wpłatę</option>
            </select>

            <button
              type="button"
              onClick={() => void handleExportExcel()}
              disabled={!filteredRows.length || exporting}
              className="bg-club-primary text-club-on-primary hover:bg-club-primary-hover flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-40"
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

      <div className="bg-club-surface rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-black">Podsumowanie rozmiarów</h2>

        <p className="mt-2 text-xs text-white/50">
          Łączna liczba sztuk w wybranej grupie.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sizeTotals.map((item) => (
            <div
              key={`${item.productId}-${item.size}`}
              className="bg-club-bg flex items-center justify-between gap-3 rounded-xl border border-white/10 p-4"
            >
              <div>
                <p className="text-sm font-semibold">
                  {PRODUCTS[item.productId].shortLabel}
                </p>
                <p className="mt-1 text-xs text-white/45">
                  Rozmiar {item.size}
                </p>
              </div>

              <span className="text-club-accent text-2xl font-black">
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
