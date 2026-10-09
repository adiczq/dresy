"use client";

import { Shirt, Trash2, Wind } from "lucide-react";

import type { SizeRecommendation } from "@/components/SizeAdvisor";
import ClothingSizes from "./ClothingSizes";
import PlayerDetails from "./PlayerDetails";
import type { PlayerDraft, ProductId } from "./types";

type PlayerCardProps = {
  showProductSelector?: boolean;
  player: PlayerDraft;
  index: number;
  recommendation?: SizeRecommendation;
  onChange: (changes: Partial<PlayerDraft>) => void;
  onRemove?: () => void;
};

const emptyRecommendation: SizeRecommendation = {
  top: null,
  bottom: null,
  set: null,
  ready: false,
  hasDifferentSizes: false,
  needsConsultation: false,
};

export default function PlayerCard({
  showProductSelector = true,
  player,
  index,
  recommendation,
  onChange,
  onRemove,
}: PlayerCardProps) {
  const hasTracksuit = player.products.includes("tracksuit");
  const hasJacket = player.products.includes("jacket");

  const suggestedTracksuit = recommendation?.ready ? recommendation.set : null;

  const suggestedJacket = recommendation?.ready ? recommendation.top : null;

  const automaticTracksuitSize = recommendation?.hasDifferentSizes
    ? null
    : suggestedTracksuit;

  const tracksuitSize =
    player.manualTracksuitSize || automaticTracksuitSize || "";

  const jacketSize = player.manualJacketSize || suggestedJacket || "";

  function toggleProduct(id: ProductId) {
    const products = player.products.includes(id)
      ? player.products.filter((product) => product !== id)
      : [...player.products, id];

    onChange({ products });
  }

  const products = [
    {
      id: "tracksuit" as ProductId,
      label: "Komplet dresowy",
      Icon: Shirt,
    },
    {
      id: "jacket" as ProductId,
      label: "Kurtka",
      Icon: Wind,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-widest text-club-accent uppercase">
            Zawodnik {index + 1}
          </p>
          <h3 className="mt-1 text-lg font-black">
            {player.playerName.trim() || "Nowy zawodnik"}
          </h3>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10"
          >
            <Trash2 size={15} />
            Usuń
          </button>
        )}
      </div>

      <PlayerDetails
        idPrefix={player.id}
        playerName={player.playerName}
        setPlayerName={(playerName) => onChange({ playerName })}
        group={player.group}
        setGroup={(group) => onChange({ group })}
        noInitials={player.noInitials}
        setNoInitials={(noInitials) => onChange({ noInitials })}
      />
      {showProductSelector && (
        <div className="border-t border-white/10 pt-6">
          <h4 className="mb-4 text-sm font-bold">
            Co zamawiamy dla tego zawodnika?
          </h4>

          <div className="grid gap-3 sm:grid-cols-2">
            {products.map(({ id, label, Icon }) => {
              const active = player.products.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleProduct(id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-sm font-semibold transition ${
                    active
                      ? "border-club-accent bg-club-accent/10 text-club-accent"
                      : "border-white/15 bg-club-bg text-white/70 hover:border-white/40"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} />
                    {label}
                  </span>
                  <span>{active ? "✓" : "+"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {(hasTracksuit || hasJacket) && (
        <div className="border-t border-white/10 pt-6">
          <ClothingSizes
            idPrefix={player.id}
            hasTracksuit={hasTracksuit}
            hasJacket={hasJacket}
            tracksuitSize={tracksuitSize}
            jacketSize={jacketSize}
            suggestedTracksuit={suggestedTracksuit}
            suggestedJacket={suggestedJacket}
            setManualTracksuitSize={(manualTracksuitSize) =>
              onChange({ manualTracksuitSize })
            }
            setManualJacketSize={(manualJacketSize) =>
              onChange({ manualJacketSize })
            }
            recommendation={recommendation ?? emptyRecommendation}
            showSizeAdvisorLink={Boolean(recommendation)}
          />
        </div>
      )}
    </div>
  );
}
