"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Ruler } from "lucide-react";

type Range = [number, number];
type Dimension = "height" | "chest" | "waist" | "hips";

type SizeRow = {
  size: string;
  age: string;
  height: Range;
  chest: Range;
  waist: Range;
  hips: Range;
};

const SIZES: SizeRow[] = [
  {
    size: "6XS",
    age: "4–5",
    height: [100, 108],
    chest: [55, 57],
    waist: [54, 55],
    hips: [60, 62],
  },
  {
    size: "5XS",
    age: "5–6",
    height: [109, 117],
    chest: [58, 61],
    waist: [56, 57],
    hips: [63, 65],
  },
  {
    size: "4XS",
    age: "7–8",
    height: [118, 128],
    chest: [62, 66],
    waist: [58, 60],
    hips: [66, 68],
  },
  {
    size: "3XS",
    age: "9–10",
    height: [129, 140],
    chest: [67, 72],
    waist: [61, 64],
    hips: [69, 74],
  },
  {
    size: "2XS",
    age: "11–12",
    height: [141, 152],
    chest: [73, 79],
    waist: [65, 68],
    hips: [75, 80],
  },
  {
    size: "XS",
    age: "12–14",
    height: [153, 164],
    chest: [80, 87],
    waist: [69, 72],
    hips: [81, 86],
  },
];

export type SizeRecommendation = {
  top: string | null;
  bottom: string | null;
  set: string | null;
  ready: boolean;
  hasDifferentSizes: boolean;
  needsConsultation: boolean;
};

const FIELDS: {
  key: Dimension;
  label: string;
  hint: string;
}[] = [
  { key: "height", label: "Wzrost", hint: "Wymagany" },
  { key: "chest", label: "Klatka piersiowa", hint: "Góra" },
  { key: "waist", label: "Obwód pasa", hint: "Dół" },
  { key: "hips", label: "Obwód bioder", hint: "Dół" },
];

type FormValues = Record<Dimension, string>;

function parseCm(value: string): number | null {
  if (!value.trim()) return null;

  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

function findSizeIndex(
  value: number | null,
  dimension: Dimension,
): number | null {
  if (value === null) return null;

  return SIZES.findIndex(({ [dimension]: range }) => {
    return value >= range[0] && value <= range[1];
  });
}

function formatRange(range: Range) {
  return `${range[0]}–${range[1]}`;
}

export default function SizeAdvisor({
  onRecommendationChange,
}: {
  onRecommendationChange?: (recommendation: SizeRecommendation) => void;
}) {
  const [values, setValues] = useState<FormValues>({
    height: "",
    chest: "",
    waist: "",
    hips: "",
  });

  const measurements = {
    height: parseCm(values.height),
    chest: parseCm(values.chest),
    waist: parseCm(values.waist),
    hips: parseCm(values.hips),
  };

  const indices = {
    height: findSizeIndex(measurements.height, "height"),
    chest: findSizeIndex(measurements.chest, "chest"),
    waist: findSizeIndex(measurements.waist, "waist"),
    hips: findSizeIndex(measurements.hips, "hips"),
  };

  const heightIndex = indices.height;

  // Góra: wzrost i klatka piersiowa
  const topIndex =
    heightIndex !== null && heightIndex >= 0 && indices.chest !== -1
      ? Math.max(heightIndex, indices.chest ?? 0)
      : null;

  // Dół: wzrost, pas i biodra
  const bottomIndex =
    heightIndex !== null &&
    heightIndex >= 0 &&
    indices.waist !== -1 &&
    indices.hips !== -1
      ? Math.max(heightIndex, indices.waist ?? 0, indices.hips ?? 0)
      : null;

  // Wspólny rozmiar kompletu - wariant do przymierzenia
  const setIndex =
    topIndex !== null && bottomIndex !== null
      ? Math.max(topIndex, bottomIndex)
      : null;

  const hasHeight = measurements.height !== null;

  const incomplete =
    measurements.chest === null ||
    measurements.waist === null ||
    measurements.hips === null;

  const outOfRange = FIELDS.filter((field) => indices[field.key] === -1);

  const nearBoundary = FIELDS.some(({ key }) => {
    const index = indices[key];
    const value = measurements[key];

    if (
      index === null ||
      index < 0 ||
      index >= SIZES.length - 1 ||
      value === null
    ) {
      return false;
    }

    return SIZES[index][key][1] - value <= 2;
  });

  const differentSizes =
    topIndex !== null && bottomIndex !== null && topIndex !== bottomIndex;
  const topSize = topIndex !== null ? SIZES[topIndex].size : null;

  const bottomSize = bottomIndex !== null ? SIZES[bottomIndex].size : null;

  const setSize = setIndex !== null ? SIZES[setIndex].size : null;

  const hasOutOfRange = outOfRange.length > 0;

  const ready = !incomplete && !hasOutOfRange && setIndex !== null;

  useEffect(() => {
    onRecommendationChange?.({
      top: topSize,
      bottom: bottomSize,
      set: setSize,
      ready,
      hasDifferentSizes: differentSizes,
      needsConsultation: hasOutOfRange,
    });
  }, [
    onRecommendationChange,
    topSize,
    bottomSize,
    setSize,
    ready,
    differentSizes,
    hasOutOfRange,
  ]);
  const results = [
    {
      title: "Bluza / kurtka",
      detail: "Wzrost + klatka piersiowa",
      index: topIndex,
    },
    {
      title: "Spodnie",
      detail: "Wzrost + pas + biodra",
      index: bottomIndex,
    },
  ];

  return (
    <section
      id="rozmiary"
      className="scroll-mt-28 border-y border-white/10 bg-club-bg"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2 text-club-accent">
            <Ruler size={18} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">
              Joma / Size Guide
            </span>
          </div>

          <h2 className="text-3xl font-black tracking-tight uppercase md:text-5xl">
            Dobierz swój <span className="text-club-accent">rozmiar.</span>
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
            Wprowadź wymiary zawodnika. Porównamy je z tabelą rozmiarów Joma i
            wskażemy orientacyjny rozmiar odzieży.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* FORMULARZ POMIARÓW */}
          <div className="rounded-3xl border border-white/10 bg-club-elevated p-6 md:p-8">
            <div className="mb-7 flex items-center justify-between">
              <h3 className="text-lg font-bold">Wymiary zawodnika</h3>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                cm
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <label key={field.key} className="block">
                  <span className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                    {field.label}
                    <span className="text-xs font-normal text-white/35">
                      {field.hint}
                    </span>
                  </span>

                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      max="250"
                      step="1"
                      value={values[field.key]}
                      onChange={(event) => {
                        setValues((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }));
                      }}
                      placeholder="Wpisz wymiar"
                      className="w-full rounded-xl border border-white/15 bg-club-bg px-4 py-4 pr-12 text-base font-semibold text-white transition outline-none placeholder:text-sm placeholder:font-normal placeholder:text-white/25 focus:border-club-accent"
                    />
                    <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-white/35">
                      cm
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <Ruler size={19} className="mt-0.5 shrink-0 text-club-accent" />
              <p className="text-xs leading-6 text-white/55">
                Mierz dziecko w pozycji stojącej. Obwody mierz miękką miarką,
                bez nadmiernego ściskania. Im więcej wymiarów podasz, tym lepiej
                można porównać je z tabelą.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setValues({
                  height: "",
                  chest: "",
                  waist: "",
                  hips: "",
                })
              }
              className="mt-5 text-xs font-semibold text-white/50 underline underline-offset-4 hover:text-white"
            >
              Wyczyść wszystkie pomiary
            </button>
          </div>

          {/* WYNIKI */}
          <div className="rounded-3xl border border-club-accent/20 bg-club-surface p-6 md:p-8">
            <p className="mb-2 text-xs font-bold tracking-[0.2em] text-club-accent uppercase">
              Twój wynik
            </p>
            <h3 className="text-2xl font-black">Rekomendacja rozmiaru</h3>

            {!hasHeight ? (
              <div className="mt-10 flex min-h-44 flex-col items-center justify-center gap-4 text-center">
                <Ruler
                  size={42}
                  strokeWidth={1.3}
                  className="text-club-accent/50"
                />
                <p className="max-w-xs text-sm leading-7 text-white/50">
                  Zacznij od podania wzrostu zawodnika, żeby zobaczyć sugerowany
                  rozmiar.
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                {results.map((result) => (
                  <div
                    key={result.title}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-club-bg/60 p-5"
                  >
                    <div>
                      <p className="font-semibold">{result.title}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {result.detail}
                      </p>
                    </div>

                    <span className="text-3xl font-black text-club-accent">
                      {result.index === null ? "—" : SIZES[result.index].size}
                    </span>
                  </div>
                ))}

                {setIndex !== null && (
                  <div className="rounded-2xl border border-club-accent/25 bg-club-accent/10 p-5">
                    <p className="text-xs font-bold tracking-wider text-club-accent uppercase">
                      Komplet w jednym rozmiarze
                    </p>
                    <p className="mt-2 text-4xl font-black">
                      {SIZES[setIndex].size}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/55">
                      Wariant do sprawdzenia przy przymiarce, jeżeli bluza i
                      spodnie muszą mieć ten sam rozmiar.
                    </p>
                  </div>
                )}

                {outOfRange.length > 0 && (
                  <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <AlertTriangle
                      size={20}
                      className="shrink-0 text-amber-300"
                    />
                    <p className="text-xs leading-6 text-amber-100">
                      Jeden lub więcej wymiarów wykracza poza dostarczoną
                      tabelę. Sprawdź poprawność pomiarów i skonsultuj rozmiar z
                      dostawcą.
                    </p>
                  </div>
                )}

                {differentSizes && (
                  <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <AlertTriangle
                      size={20}
                      className="shrink-0 text-amber-300"
                    />
                    <p className="text-xs leading-6 text-amber-100">
                      Wymiary wskazują różne rozmiary góry i dołu. Przed
                      zamówieniem kompletu warto przymierzyć odzież i
                      potwierdzić możliwość wyboru osobnych rozmiarów.
                    </p>
                  </div>
                )}

                {nearBoundary && (
                  <div className="flex gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                    <AlertTriangle
                      size={20}
                      className="shrink-0 text-club-accent"
                    />
                    <p className="text-xs leading-6 text-white/65">
                      Co najmniej jeden wymiar jest blisko górnej granicy
                      rozmiaru. Warto porównać również kolejny rozmiar.
                    </p>
                  </div>
                )}

                {incomplete && outOfRange.length === 0 && (
                  <p className="text-xs leading-6 text-white/45">
                    Wynik wstępny — uzupełnij pozostałe obwody, aby sprawdzić
                    dopasowanie góry i dołu.
                  </p>
                )}

                {!incomplete &&
                  !differentSizes &&
                  !nearBoundary &&
                  outOfRange.length === 0 && (
                    <div className="flex items-center gap-2 text-xs text-club-accent">
                      <CheckCircle2 size={17} />
                      Wymiary mieszczą się w zakresach wskazanego rozmiaru.
                    </div>
                  )}
              </div>
            )}

            <p className="mt-7 border-t border-white/10 pt-5 text-xs leading-6 text-white/40">
              Rekomendacja jest orientacyjna. Dopasowanie zależy także od kroju
              modelu, preferowanego luzu i rzeczywistych wymiarów odzieży. Wynik
              nie zastępuje przymiarki.
            </p>
          </div>
        </div>

        {/* TABELA PRODUCENTA */}
        <details className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-club-elevated">
          <summary className="cursor-pointer px-6 py-5 text-sm font-semibold hover:text-club-accent">
            Pokaż pełną tabelę rozmiarów Joma
          </summary>

          <div className="overflow-x-auto px-4 pb-6 md:px-6">
            <table className="w-full min-w-[590px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/15 text-xs text-white/45">
                  <th className="p-3">Rozmiar</th>
                  <th className="p-3">Wiek</th>
                  <th className="p-3">Wzrost</th>
                  <th className="p-3">Klatka</th>
                  <th className="p-3">Pas</th>
                  <th className="p-3">Biodra</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((row) => (
                  <tr key={row.size} className="border-b border-white/5">
                    <td className="p-3 font-bold text-club-accent">{row.size}</td>
                    <td className="p-3">{row.age}</td>
                    <td className="p-3">{formatRange(row.height)}</td>
                    <td className="p-3">{formatRange(row.chest)}</td>
                    <td className="p-3">{formatRange(row.waist)}</td>
                    <td className="p-3">{formatRange(row.hips)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-white/40">
              Wszystkie wymiary w centymetrach. Tabela dziecięca przekazana
              przez klub.
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
