"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Info, UserRoundPlus } from "lucide-react";

import OrderConfirmation from "@/components/order/OrderConfirmation";
import OrderSummary from "@/components/order/OrderSummary";
import ParentDetails from "@/components/order/ParentDetails";
import PlayerCard from "@/components/order/PlayerCard";

import type {
  OrderFormProps,
  OrderItem,
  OrderPlayer,
  PlayerDraft,
} from "@/components/order/types";

import { getPlayerInitials } from "@/lib/initials";
import { PRODUCTS, formatPrice, getLinePrice, getOrderPrice } from "@/lib/products";

export default function OrderForm({
  selectedProducts,
  recommendation,
}: OrderFormProps) {
  const [players, setPlayers] = useState<PlayerDraft[]>([
    {
      id: "player-1",
      playerName: "",
      group: "",
      noInitials: false,
      products: selectedProducts,
      manualTracksuitSize: "",
      manualJacketSize: "",
      manualBasicJacketSize: "",
    },
  ]);

  const [parentName, setParentName] = useState("");
  const [phone, setPhone] = useState("");

  const [showPreview, setShowPreview] = useState(false);
  const [formError, setFormError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [savedOrder, setSavedOrder] = useState<{
    reference: string;
    totalPrice: number;
  } | null>(null);

  // Produkty pierwszego zawodnika wybieramy
  // w głównej sekcji produktów na stronie.
  const currentPlayers = players.map((player, index) =>
    index === 0 ? { ...player, products: selectedProducts } : player,
  );

  // Przygotowanie osobnych produktów i rozmiarów.
  const orderPlayers: OrderPlayer[] = currentPlayers.map((player, index) => {
    const isFirst = index === 0;

    const suggestedSet =
      isFirst && recommendation.ready && !recommendation.hasDifferentSizes
        ? recommendation.set
        : null;

    const suggestedJacket =
      isFirst && recommendation.ready ? recommendation.top : null;

    const items: OrderItem[] = [];

    if (player.products.includes("tracksuit")) {
      items.push({
        productId: "tracksuit",
        size: player.manualTracksuitSize || suggestedSet || "",
        quantity: 1,
      });
    }

    if (player.products.includes("jacket")) {
      items.push({
        productId: "jacket",
        size: player.manualJacketSize || suggestedJacket || "",
        quantity: 1,
      });
    }

    if (player.products.includes("jacket_basic")) {
      items.push({
        productId: "jacket_basic",
        size: player.manualBasicJacketSize || suggestedJacket || "",
        quantity: 1,
      });
    }

    return {
      playerName: player.playerName.trim(),
      group: player.group.trim(),
      noInitials: player.noInitials,
      items,
    };
  });

  function updatePlayer(id: string, changes: Partial<PlayerDraft>) {
    setPlayers((current) =>
      current.map((player) =>
        player.id === id ? { ...player, ...changes } : player,
      ),
    );

    setShowPreview(false);
    setFormError("");
    setSaveError("");
  }

  function addPlayer() {
    if (players.length >= 4) return;

    setPlayers((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        playerName: "",
        group: "",
        noInitials: false,
        products: [],
        manualTracksuitSize: "",
        manualJacketSize: "",
      manualBasicJacketSize: "",
      },
    ]);

    setShowPreview(false);
    setFormError("");
  }

  function validate(): string | null {
    if (!parentName.trim() || !phone.trim()) {
      return "Uzupełnij dane opiekuna.";
    }

    const digits = phone.replace(/\D/g, "");

    if (
      digits.length < 9 ||
      digits.length > 15 ||
      !/^[+\d\s()-]+$/.test(phone.trim())
    ) {
      return "Wpisz poprawny numer telefonu.";
    }

    for (let index = 0; index < orderPlayers.length; index++) {
      const player = orderPlayers[index];

      if (player.playerName.length < 3 || !player.group) {
        return `Uzupełnij imię, nazwisko i grupę zawodnika ${index + 1}.`;
      }

      if (player.items.length === 0) {
        return `Wybierz odzież dla zawodnika ${index + 1}.`;
      }

      if (player.items.some((item) => !item.size)) {
        return `Wybierz rozmiary odzieży zawodnika ${index + 1}.`;
      }
    }

    return null;
  }

  function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const error = validate();

    setFormError(error ?? "");
    setSaveError("");
    setCopyStatus("");

    if (!error) {
      setShowPreview(true);
    }
  }

  const orderTotal = getOrderPrice(orderPlayers);

  const summary = [
    "GÓRNIK RADLIN — PODGLĄD ZGŁOSZENIA",
    `Opiekun: ${parentName.trim()}`,
    `Telefon: ${phone.trim()}`,

    ...orderPlayers.flatMap((player, index) => [
      "",
      `Zawodnik ${index + 1}: ${player.playerName}`,
      `Grupa: ${player.group}`,
      `Inicjały: ${
        player.noInitials
          ? "Bez inicjałów"
          : getPlayerInitials(player.playerName)
      }`,

      ...player.items.map((item) =>
        `${PRODUCTS[item.productId].shortLabel}: ${item.size} × ${item.quantity} — ${formatPrice(getLinePrice(item))}`,
      ),
      `Razem za zawodnika: ${formatPrice(player.items.reduce((sum, item) => sum + getLinePrice(item), 0))}`,
    ]),

    "",
    `ŁĄCZNIE DO ZAPŁATY: ${formatPrice(orderTotal)}`,
    "To podgląd — zgłoszenie nie zostało zapisane.",
  ].join("\n");

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Skopiowano podsumowanie.");
    } catch {
      setCopyStatus("Nie udało się skopiować podsumowania.");
    }
  }

  async function saveOrder() {
    if (isSaving || savedOrder) return;

    const error = validate();

    if (error) {
      setSaveError(error);
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentName: parentName.trim(),
          phone: phone.trim(),
          players: orderPlayers,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        reference?: string;
        totalPrice?: number;
        error?: string;
      };

      if (!response.ok || !data.success || !data.reference) {
        throw new Error(data.error || "Nie udało się zapisać zgłoszenia.");
      }

      setCopyStatus("");
      setSavedOrder({
        reference: data.reference,
        totalPrice: data.totalPrice ?? orderTotal,
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Wystąpił problem z zapisem zgłoszenia.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (savedOrder) {
    return (
      <OrderConfirmation
        reference={savedOrder.reference}
        totalPrice={savedOrder.totalPrice}
        players={orderPlayers}
        parentName={parentName}
        copyStatus={copyStatus}
        setCopyStatus={setCopyStatus}
      />
    );
  }

  return (
    <section
      id="zamowienie"
      className="bg-club-bg scroll-mt-28 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10">
          <p className="text-club-accent mb-3 text-xs font-bold tracking-[0.2em] uppercase">
            Formularz klubowy
          </p>

          <h2 className="text-3xl font-black tracking-tight uppercase md:text-5xl">
            Zgłoś odzież
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
            Wpisz zawodników i ich rozmiary. Dane opiekuna wystarczy podać raz.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          <form
            onSubmit={handlePreview}
            className="bg-club-surface w-full min-w-0 space-y-8 rounded-3xl border border-white/10 p-4 sm:p-6 md:p-8"
          >
            {currentPlayers.map((player, index) => (
              <div
                key={player.id}
                className={index > 0 ? "border-t border-white/10 pt-8" : ""}
              >
                <PlayerCard
                  player={player}
                  index={index}
                  recommendation={index === 0 ? recommendation : undefined}
                  showProductSelector={index !== 0}
                  onChange={(changes) => updatePlayer(player.id, changes)}
                  onRemove={
                    index > 0
                      ? () => {
                          setPlayers((current) =>
                            current.filter((item) => item.id !== player.id),
                          );
                          setShowPreview(false);
                          setFormError("");
                        }
                      : undefined
                  }
                />
              </div>
            ))}

            {players.length < 4 && (
              <button
                type="button"
                onClick={addPlayer}
                className="border-club-accent/50 text-club-accent hover:bg-club-accent/10 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-5 py-4 text-sm font-bold transition"
              >
                <UserRoundPlus size={19} />
                Dodaj kolejnego zawodnika
              </button>
            )}

            <div className="border-t border-white/10 pt-8">
              <ParentDetails
                parentName={parentName}
                setParentName={(value) => {
                  setParentName(value);
                  setShowPreview(false);
                }}
                phone={phone}
                setPhone={(value) => {
                  setPhone(value);
                  setShowPreview(false);
                }}
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="flex gap-2 text-xs leading-6 text-white/50">
                <Info size={17} className="text-club-accent mt-1 shrink-0" />
                Dane zawodników i opiekuna zostaną zapisane po kliknięciu
                „Zapisz zgłoszenie”. Pomiary nie są zapisywane.
              </p>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-red-300">
                {formError}
              </p>
            )}

            <button
              type="submit"
              className="bg-club-primary text-club-on-primary hover:bg-club-primary-hover flex w-full items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-extrabold"
            >
              Sprawdź zgłoszenie
              <ArrowRight size={18} />
            </button>
          </form>

          <OrderSummary
            players={orderPlayers}
            parentName={parentName}
            showPreview={showPreview}
            isSaving={isSaving}
            saveError={saveError}
            copyStatus={copyStatus}
            copySummary={copySummary}
            saveOrder={saveOrder}
          />
        </div>
      </div>
    </section>
  );
}
