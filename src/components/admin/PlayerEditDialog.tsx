"use client";

import { useState, type FormEvent } from "react";
import { Pencil, X } from "lucide-react";
import type { AdminOrderRow } from "@/lib/admin-orders";
import { ORDER_SIZES } from "@/lib/sizes";

const SIZES = ORDER_SIZES;

export type PlayerEditUpdate = {
  playerKey: string;
  playerName: string;
  group: string;
  initials: string | null;
  tracksuitSize?: string;
  jacketSize?: string;
  basicJacketSize?: string;
};

type Props = {
  rows: AdminOrderRow[];
  onClose: () => void;
  onSaved: (update: PlayerEditUpdate) => void;
};

export default function PlayerEditDialog({ rows, onClose, onSaved }: Props) {
  const player = rows[0];

  const tracksuit = rows.find((row) => row.productId === "tracksuit");

  const jacket = rows.find((row) => row.productId === "jacket");
  const basicJacket = rows.find((row) => row.productId === "jacket_basic");

  const [playerName, setPlayerName] = useState(player.playerName);
  const [group, setGroup] = useState(player.group);
  const [noInitials, setNoInitials] = useState(player.initials === null);
  const [initials, setInitials] = useState(player.initials ?? "");
  const [tracksuitSize, setTracksuitSize] = useState(tracksuit?.size ?? "");
  const [jacketSize, setJacketSize] = useState(jacket?.size ?? "");
  const [basicJacketSize, setBasicJacketSize] = useState(
    basicJacket?.size ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const groups = [
    ...new Set([
      player.group,
      "Skrzat 2020",
      "Żaki 2019",
      "Żaki 2018",
      "Orlik 2017",
      "Orlik 2017 II",
      "Orlik 2016",
      "Trampkarze 2013",
      "Junior Młodszy 2010",
    ]),
  ].filter(Boolean);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setError("");

    const cleanedInitials = noInitials
      ? ""
      : initials.trim().toLocaleUpperCase("pl-PL");

    try {
      const response = await fetch("/api/admin/players", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: player.orderId,
          playerIndex: player.playerIndex,
          playerName: playerName.trim(),
          group: group.trim(),
          noInitials,
          initials: cleanedInitials,
          ...(tracksuit ? { tracksuitSize } : {}),
          ...(jacket ? { jacketSize } : {}),
          ...(basicJacket ? { basicJacketSize } : {}),
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Nie udało się zapisać zmian.");
      }

      onSaved({
        playerKey: player.playerKey,
        playerName: playerName.trim(),
        group: group.trim(),
        initials: noInitials ? null : cleanedInitials,
        ...(tracksuit ? { tracksuitSize } : {}),
        ...(jacket ? { jacketSize } : {}),
        ...(basicJacket ? { basicJacketSize } : {}),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Wystąpił błąd podczas zapisu.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-player-title"
        className="bg-club-surface max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 p-6 text-white shadow-2xl md:p-8"
      >
        <div className="mb-7 flex items-center justify-between gap-3">
          <div>
            <p className="text-club-accent mb-2 text-xs font-bold tracking-widest uppercase">
              Panel trenerów
            </p>

            <h2
              id="edit-player-title"
              className="flex items-center gap-2 text-xl font-black"
            >
              <Pencil size={20} className="text-club-accent" />
              Edytuj zawodnika
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Zamknij edycję"
            className="rounded-lg p-2 text-white/60 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="edit-player-name"
              className="mb-2 block text-sm font-semibold"
            >
              Imię i nazwisko
            </label>

            <input
              id="edit-player-name"
              autoFocus
              required
              minLength={3}
              maxLength={100}
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="edit-group"
              className="mb-2 block text-sm font-semibold"
            >
              Grupa treningowa
            </label>

            <select
              id="edit-group"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-4 py-3 text-sm outline-none"
            >
              {groups.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-initials"
              className="mb-2 block text-sm font-semibold"
            >
              Inicjały do nadruku
            </label>

            <input
              id="edit-initials"
              maxLength={6}
              required={!noInitials}
              disabled={noInitials}
              value={initials}
              onChange={(event) => setInitials(event.target.value)}
              className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-4 py-3 text-sm uppercase outline-none disabled:opacity-40"
            />

            <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-white/60">
              <input
                type="checkbox"
                checked={noInitials}
                onChange={(event) => setNoInitials(event.target.checked)}
                className="accent-club-accent h-4 w-4"
              />
              Bez inicjałów
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {tracksuit && (
              <div>
                <label
                  htmlFor="edit-tracksuit"
                  className="mb-2 block text-sm font-semibold"
                >
                  Rozmiar dresu
                </label>

                <select
                  id="edit-tracksuit"
                  value={tracksuitSize}
                  onChange={(event) => setTracksuitSize(event.target.value)}
                  className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-3 py-3 text-sm outline-none"
                >
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {jacket && (
              <div>
                <label
                  htmlFor="edit-jacket"
                  className="mb-2 block text-sm font-semibold"
                >
                  Rozmiar kurtki Joma
                </label>
                <select
                  id="edit-jacket"
                  value={jacketSize}
                  onChange={(event) => setJacketSize(event.target.value)}
                  className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-3 py-3 text-sm outline-none"
                >
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {basicJacket && (
              <div>
                <label
                  htmlFor="edit-basic-jacket"
                  className="mb-2 block text-sm font-semibold"
                >
                  Rozmiar kurtki ekonomicznej
                </label>
                <select
                  id="edit-basic-jacket"
                  value={basicJacketSize}
                  onChange={(event) => setBasicJacketSize(event.target.value)}
                  className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-3 py-3 text-sm outline-none"
                >
                  {SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-xs leading-6 text-white/40">
            Zmiany rozmiarów, grupy i inicjałów zapiszą się w bazie klubu.
            Status płatności pozostanie bez zmian.
          </p>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10"
            >
              Anuluj
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-club-primary text-club-on-primary hover:bg-club-primary-hover flex-1 rounded-xl px-4 py-3 text-sm font-extrabold disabled:opacity-50"
            >
              {saving ? "Zapisywanie..." : "Zapisz zmiany"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
