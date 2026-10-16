"use client";

import { Trash2 } from "lucide-react";
import type { SizeRecommendation } from "@/components/SizeAdvisor";
import { PACKAGES, formatPrice } from "@/lib/products";
import ClothingSizes from "./ClothingSizes";
import PlayerDetails from "./PlayerDetails";
import type { PlayerDraft } from "./types";

type Props = {
  player: PlayerDraft;
  index: number;
  recommendation?: SizeRecommendation;
  showPackageSelector?: boolean;
  onChange: (changes: Partial<PlayerDraft>) => void;
  onRemove?: () => void;
};

export default function PlayerCard({player, index, recommendation, showPackageSelector = true, onChange, onRemove}: Props) {
  const suggestedTop = recommendation?.ready ? recommendation.top : null;
  const suggestedBottom = recommendation?.ready ? recommendation.bottom : null;

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-club-accent text-xs font-bold tracking-widest uppercase">Zawodnik {index + 1}</p>
          <h3 className="mt-1 text-lg font-black">{player.playerName.trim() || "Nowy zawodnik"}</h3>
        </div>
        {onRemove && <button type="button" onClick={onRemove} className="flex items-center gap-2 rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300 transition hover:bg-red-400/10"><Trash2 size={15}/> Usuń</button>}
      </div>
      <PlayerDetails
        idPrefix={player.id} playerName={player.playerName}
        setPlayerName={(playerName) => onChange({playerName})}
        group={player.group} setGroup={(group) => onChange({group})}
        noInitials={player.noInitials} setNoInitials={(noInitials) => onChange({noInitials})}
      />
      {showPackageSelector ? (
        <div className="space-y-3 border-t border-white/10 pt-6">
          <h4 className="text-sm font-bold">Pakiet dla tego zawodnika</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["package_1", "package_2"] as const).map((id) => (
              <button key={id} type="button" aria-pressed={player.packageId === id}
                onClick={() => onChange({packageId: id, manualJacketSize: ""})}
                className={`rounded-xl border p-4 text-left text-sm font-semibold ${player.packageId === id ? "border-club-accent bg-club-accent/10 text-club-accent" : "border-white/15 bg-club-bg text-white/70"}`}>
                {PACKAGES[id].label} — {formatPrice(PACKAGES[id].price)}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="border-t border-white/10 pt-5 text-sm font-semibold text-club-accent">
          {PACKAGES[player.packageId].label} · {formatPrice(PACKAGES[player.packageId].price)}
        </p>
      )}
      <div className="border-t border-white/10 pt-6">
        <ClothingSizes
          idPrefix={player.id} packageId={player.packageId}
          pantsSize={player.manualPantsSize || suggestedBottom || ""}
          sweatshirtSize={player.manualSweatshirtSize || suggestedTop || ""}
          jacketSize={player.manualJacketSize || suggestedTop || ""}
          setPantsSize={(manualPantsSize) => onChange({manualPantsSize})}
          setSweatshirtSize={(manualSweatshirtSize) => onChange({manualSweatshirtSize})}
          setJacketSize={(manualJacketSize) => onChange({manualJacketSize})}
          recommendation={recommendation}
        />
      </div>
    </div>
  );
}
