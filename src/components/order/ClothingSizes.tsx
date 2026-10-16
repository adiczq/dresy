import { Check, Ruler } from "lucide-react";
import type { SizeRecommendation } from "@/components/SizeAdvisor";
import { PACKAGES, PRODUCTS, type PackageId } from "@/lib/products";
import SizePicker from "./SizePicker";

type Props = {
  idPrefix: string;
  packageId: PackageId;
  pantsSize: string;
  sweatshirtSize: string;
  jacketSize: string;
  setPantsSize: (value: string) => void;
  setSweatshirtSize: (value: string) => void;
  setJacketSize: (value: string) => void;
  recommendation?: SizeRecommendation;
};

export default function ClothingSizes({
  idPrefix,
  packageId,
  pantsSize,
  sweatshirtSize,
  jacketSize,
  setPantsSize,
  setSweatshirtSize,
  setJacketSize,
  recommendation,
}: Props) {
  const jacket = PACKAGES[packageId].jacketId;

  const suggestedTop = recommendation?.ready ? recommendation.top : null;

  const suggestedBottom = recommendation?.ready ? recommendation.bottom : null;

  const selectedCount = [pantsSize, sweatshirtSize, jacketSize].filter(
    Boolean,
  ).length;

  const sizes = [
    {
      id: `${idPrefix}-pants`,
      label: "Spodnie",
      value: pantsSize,
      suggestion: suggestedBottom,
      onChange: setPantsSize,
    },
    {
      id: `${idPrefix}-sweatshirt`,
      label: "Bluza",
      value: sweatshirtSize,
      suggestion: suggestedTop,
      onChange: setSweatshirtSize,
    },
    {
      id: `${idPrefix}-jacket`,
      label: PRODUCTS[jacket].label,
      value: jacketSize,
      suggestion: suggestedTop,
      onChange: setJacketSize,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Ruler size={21} className="text-club-accent" />
          <h3 className="text-lg font-bold">Rozmiary elementów pakietu</h3>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${
            selectedCount === 3
              ? "bg-club-accent/15 text-club-accent"
              : "bg-white/10 text-white/65"
          }`}
        >
          {selectedCount === 3
            ? "✓ Komplet rozmiarów"
            : `${selectedCount} z 3 wybranych`}
        </span>
      </div>

      <div className="grid gap-3">
        {sizes.map((item) => {
          const selected = Boolean(item.value);

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition-colors ${
                selected
                  ? "border-club-accent/50 bg-club-accent/5"
                  : "bg-club-bg/40 border-white/10"
              }`}
            >
              <div className="mb-3 flex items-center justify-end">
                {selected ? (
                  <div className="text-club-accent flex items-center gap-1.5 text-xs font-semibold">
                    <Check size={15} />
                    Wybrano: {item.value}
                  </div>
                ) : (
                  <span className="text-xs text-white/40">Wybierz rozmiar</span>
                )}
              </div>

              <SizePicker
                id={item.id}
                label={item.label}
                value={item.value}
                suggestion={item.suggestion}
                onChange={item.onChange}
              />
            </div>
          );
        })}
      </div>

      {recommendation?.hasDifferentSizes && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
          Kalkulator wskazuje różne rozmiary góry i spodni. Wybierz osobno
          rozmiar każdego elementu pakietu.
        </p>
      )}

      {recommendation?.needsConsultation && (
        <p className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-xs leading-6 text-amber-100">
          Część pomiarów wymaga konsultacji. Przed zamówieniem sprawdź
          dopasowanie odzieży.
        </p>
      )}

      {recommendation && (
        <a
          href="#rozmiary"
          className="text-club-accent inline-flex items-center gap-2 text-xs font-semibold hover:underline"
        >
          <Ruler size={15} />
          Wróć do kalkulatora rozmiarów
        </a>
      )}
    </div>
  );
}
