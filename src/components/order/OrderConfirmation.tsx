import { CheckCircle2, Copy } from "lucide-react";

import { PRODUCTS, PACKAGES, formatPrice } from "@/lib/products";
import type { OrderPlayer } from "./types";

type Props = {
  reference: string;
  numbers: (number | null)[];
  totalPrice: number;
  players: OrderPlayer[];
  parentName: string;
  copyStatus: string;
  setCopyStatus: (status: string) => void;
};

export default function OrderConfirmation({
  reference,
  numbers,
  totalPrice,
  players,
  parentName,
  copyStatus,
  setCopyStatus,
}: Props) {
  const confirmation = [
    "GÓRNIK RADLIN — ZGŁOSZENIE ZAPISANE",
    `Numer: ${reference}`,
    `Opiekun: ${parentName}`,

    ...players.flatMap((player, index) => [
      "",
      `Zawodnik ${index + 1}: ${player.playerName}`,
      `Grupa: ${player.group}`,
      `Numer zawodnika: ${numbers[index] ?? "Nienadany"}`,

      `Pakiet: ${PACKAGES[player.packageId].label} — ${formatPrice(PACKAGES[player.packageId].price)}`,
      ...player.items.map((item) =>
        `${PRODUCTS[item.productId].shortLabel}: ${item.size}`,
      ),
    ]),

    "",
    `ŁĄCZNIE DO ZAPŁATY: ${formatPrice(totalPrice)}`,
    "Status: zgłoszenie zapisane.",
  ].join("\n");

  return (
    <section
      id="zamowienie"
      className="border-y border-white/10 bg-club-bg px-5 py-20"
    >
      <div className="mx-auto max-w-xl rounded-3xl border border-club-accent/20 bg-club-surface p-6 text-center md:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-club-primary text-club-on-primary">
          <CheckCircle2 size={42} strokeWidth={2} />
        </div>

        <h2 className="mt-6 text-2xl font-black uppercase md:text-3xl">
          Zgłoszenie zapisane!
        </h2>

        <p className="mt-3 text-sm leading-7 text-white/55">
          Wybrane pakiety trafiły na listę klubową.
        </p>

        <div className="mt-8 rounded-2xl border border-club-accent/25 bg-club-accent/10 p-6">
          <p className="text-xs font-bold tracking-widest text-club-accent uppercase">
            Numer zgłoszenia
          </p>

          <p className="mt-3 text-2xl font-black break-all md:text-3xl">
            {reference}
          </p>
        </div>

        <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-club-bg p-5 text-left text-sm">
          {players.map((player, index) => (
            <div
              key={index}
              className="space-y-2 border-b border-white/10 pb-4 last:border-0 last:pb-0"
            >
              <p className="font-bold">{player.playerName}</p>

              <p className="text-white/55">{player.group}</p>
              {numbers[index] != null && (
                <p className="text-sm font-bold text-club-accent">
                  Numer odzieży: {numbers[index]}
                </p>
              )}

              <p className="font-semibold text-club-accent">{PACKAGES[player.packageId].label}</p>
              {player.items.map((item) => (
                <div key={item.productId} className="flex justify-between gap-3">
                  <span className="text-white/65">{PRODUCTS[item.productId].shortLabel}</span>
                  <span className="font-semibold">{item.size}</span>
                </div>
              ))}
              <p className="text-right font-bold text-club-accent">{formatPrice(PACKAGES[player.packageId].price)}</p>
            </div>
          ))}

          <p className="text-xs text-white/55">Opiekun: {parentName}</p>
          <p className="flex items-center justify-between gap-2 border-t border-white/15 pt-4 font-bold">
            <span>Łącznie do zapłaty</span>
            <span className="text-lg text-club-accent">{formatPrice(totalPrice)}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(confirmation);
              setCopyStatus("Potwierdzenie skopiowane.");
            } catch {
              setCopyStatus("Nie udało się skopiować potwierdzenia.");
            }
          }}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-club-primary px-6 py-4 text-sm font-extrabold text-club-on-primary hover:bg-club-primary-hover"
        >
          <Copy size={18} />
          Kopiuj potwierdzenie
        </button>

        {copyStatus && (
          <p role="status" className="mt-3 text-xs text-white/60">
            {copyStatus}
          </p>
        )}

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 w-full rounded-xl border border-white/15 px-6 py-4 text-sm font-semibold hover:bg-white/5"
        >
          Dodaj kolejne zgłoszenie
        </button>

        <p className="mt-6 text-xs leading-6 text-white/40">
          Zachowaj numer zgłoszenia. Edycję dodamy w kolejnym etapie.
        </p>
      </div>
    </section>
  );
}
