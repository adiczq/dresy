import { Ruler } from "lucide-react";
import type { SizeRecommendation } from "@/components/SizeAdvisor";
import SizePicker from "./SizePicker";

type ClothingSizesProps = {
  idPrefix?: string;
  showSizeAdvisorLink?: boolean;
  hasTracksuit: boolean;
  hasJacket: boolean;
  hasBasicJacket: boolean;
  tracksuitSize: string;
  jacketSize: string;
  basicJacketSize: string;
  suggestedTracksuit: string | null;
  suggestedJacket: string | null;
  setManualTracksuitSize: (value: string) => void;
  setManualJacketSize: (value: string) => void;
  setManualBasicJacketSize: (value: string) => void;
  recommendation: SizeRecommendation;
};

export default function ClothingSizes({
  idPrefix = "player-1",
  showSizeAdvisorLink = true,
  hasTracksuit,
  hasJacket,
  hasBasicJacket,
  tracksuitSize,
  jacketSize,
  basicJacketSize,
  suggestedTracksuit,
  suggestedJacket,
  setManualTracksuitSize,
  setManualJacketSize,
  setManualBasicJacketSize,
  recommendation,
}: ClothingSizesProps) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <Ruler size={21} className="text-club-accent" />
        <h3 className="text-lg font-bold">Rozmiary odzieży</h3>
      </div>
      <div className="space-y-5">
        {hasTracksuit && (
          <SizePicker
            id={`${idPrefix}-tracksuit-size`}
            label="Rozmiar kompletu dresowego"
            value={tracksuitSize}
            suggestion={suggestedTracksuit}
            onChange={setManualTracksuitSize}
          />
        )}
        {hasJacket && (
          <SizePicker
            id={`${idPrefix}-jacket-size`}
            label="Rozmiar kurtki Joma (120 zł)"
            value={jacketSize}
            suggestion={suggestedJacket}
            onChange={setManualJacketSize}
          />
        )}
        {hasBasicJacket && (
          <SizePicker
            id={`${idPrefix}-basic-jacket-size`}
            label="Rozmiar kurtki ekonomicznej (80 zł)"
            value={basicJacketSize}
            suggestion={suggestedJacket}
            onChange={setManualBasicJacketSize}
          />
        )}
      </div>
      {recommendation.hasDifferentSizes && hasTracksuit && (
        <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
          Uwaga: kalkulator wskazuje inny rozmiar góry ({recommendation.top}) i
          spodni ({recommendation.bottom}). Rozmiar kompletu wybierz ręcznie po
          sprawdzeniu dopasowania.
        </div>
      )}
      {recommendation.needsConsultation && (
        <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
          Niektóre wymiary są poza dostarczoną tabelą Joma. Przed zamówieniem
          potwierdź rozmiar z dostawcą.
        </div>
      )}
      {showSizeAdvisorLink && (
        <a
          href="#rozmiary"
          className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-club-accent hover:underline"
        >
          <Ruler size={15} />
          Wróć do kalkulatora rozmiarów
        </a>
      )}
      <p className="mt-3 text-xs leading-6 text-white/40">
        Rozmiary są orientacyjne. Krój obu kurtek może różnić się od kompletu
        dresowego i od siebie nawzajem. Przed zakupem potwierdź dopasowanie.
      </p>
    </div>
  );
}
