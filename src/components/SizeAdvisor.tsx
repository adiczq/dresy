"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Ruler } from "lucide-react";

type Range = readonly [number, number];
type Dimension = "height" | "chest" | "waist" | "hips" | "legLength";
type RangeDimension = Exclude<Dimension, "legLength">;
type Category = "junior" | "adult";
type MeasurementValues = Record<Dimension, string>;

type JuniorRow = {
  size: string;
  age: string;
  height: Range;
  chest: Range;
  waist: Range;
  hips: Range;
};

type AdultRow = {
  size: string;
  chest: Range;
  waist: Range;
  hips: Range;
  legLength: number;
};

const JUNIOR_SIZES: JuniorRow[] = [
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

// Joma: ostatni wiersz producenta obejmuje łącznie XXL–3XL.
// Nie rekomendujemy automatycznie ani XXL, ani 3XL osobno.
const ADULT_SIZES: AdultRow[] = [
  {
    size: "S",
    chest: [87, 94],
    waist: [75, 82],
    hips: [86, 93],
    legLength: 81.5,
  },
  {
    size: "M",
    chest: [95, 101],
    waist: [83, 90],
    hips: [94, 100],
    legLength: 82,
  },
  {
    size: "L",
    chest: [102, 108],
    waist: [91, 97],
    hips: [101, 108],
    legLength: 82.5,
  },
  {
    size: "XL",
    chest: [109, 114],
    waist: [98, 103],
    hips: [109, 113],
    legLength: 83,
  },
  {
    size: "XXL–3XL",
    chest: [115, 143],
    waist: [104, 134],
    hips: [114, 138],
    legLength: 83.5,
  },
];

const INITIAL_VALUES: MeasurementValues = {
  height: "",
  chest: "",
  waist: "",
  hips: "",
  legLength: "",
};

const FIELDS: { key: Dimension; label: string; hint: string }[] = [
  { key: "height", label: "Wzrost", hint: "Junior — wymagany" },
  { key: "chest", label: "Klatka piersiowa", hint: "Góra" },
  { key: "waist", label: "Obwód pasa", hint: "Góra i dół" },
  { key: "hips", label: "Obwód bioder", hint: "Góra i dół" },
  {
    key: "legLength",
    label: "Długość nogawki od kroku",
    hint: "Dół · kontrola",
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

function parseCm(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

// Długości w tabeli dorosłych mają połówki centymetra.
function parseLegCm(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function indexInRanges<T>(
  rows: T[],
  value: number | null,
  getRange: (row: T) => Range,
): number | null {
  if (value === null) return null;
  return rows.findIndex((row) => {
    const [min, max] = getRange(row);
    return value >= min && value <= max;
  });
}

function formatRange([min, max]: Range): string {
  return `${min}–${max}`;
}

export default function SizeAdvisor({
  onRecommendationChange,
}: {
  onRecommendationChange?: (recommendation: SizeRecommendation) => void;
}) {
  const [category, setCategory] = useState<Category>("junior");
  const [values, setValues] = useState<MeasurementValues>(INITIAL_VALUES);

  const measures = {
    height: parseCm(values.height),
    chest: parseCm(values.chest),
    waist: parseCm(values.waist),
    hips: parseCm(values.hips),
    legLength: parseLegCm(values.legLength),
  };

  const junior = category === "junior";
  const rows = junior ? JUNIOR_SIZES : ADULT_SIZES;
  const heightIndex = junior
    ? indexInRanges(JUNIOR_SIZES, measures.height, (row) => row.height)
    : null;
  const chestIndex = junior
    ? indexInRanges(JUNIOR_SIZES, measures.chest, (row) => row.chest)
    : indexInRanges(ADULT_SIZES, measures.chest, (row) => row.chest);
  const waistIndex = junior
    ? indexInRanges(JUNIOR_SIZES, measures.waist, (row) => row.waist)
    : indexInRanges(ADULT_SIZES, measures.waist, (row) => row.waist);
  const hipsIndex = junior
    ? indexInRanges(JUNIOR_SIZES, measures.hips, (row) => row.hips)
    : indexInRanges(ADULT_SIZES, measures.hips, (row) => row.hips);

  const validIndex = (index: number | null): index is number =>
    index !== null && index >= 0;
  const topIndex = junior
    ? validIndex(heightIndex) && validIndex(chestIndex)
      ? Math.max(heightIndex, chestIndex)
      : null
    : validIndex(chestIndex)
      ? chestIndex
      : null;
  const bottomIndex = junior
    ? validIndex(heightIndex) && validIndex(waistIndex) && validIndex(hipsIndex)
      ? Math.max(heightIndex, waistIndex, hipsIndex)
      : null
    : validIndex(waistIndex) && validIndex(hipsIndex)
      ? Math.max(waistIndex, hipsIndex)
      : null;

  const setIndex =
    topIndex !== null && bottomIndex !== null
      ? Math.max(topIndex, bottomIndex)
      : null;

  const outOfRange = [
    ...(junior && heightIndex === -1 ? ["wzrost"] : []),
    ...(chestIndex === -1 ? ["klatka piersiowa"] : []),
    ...(waistIndex === -1 ? ["pas"] : []),
    ...(hipsIndex === -1 ? ["biodra"] : []),
  ];
  const incomplete =
    (junior && measures.height === null) ||
    (!junior && measures.legLength === null) ||
    measures.chest === null ||
    measures.waist === null ||
    measures.hips === null;

  // Tabela podaje długość nogawki jako wartość referencyjną, nie przedział.
  // Nie wybieramy rozmiaru na podstawie samej długości, lecz sprawdzamy
  // dopasowanie spodni po doborze na podstawie pasa i bioder.
  const referenceLegLength =
    !junior && bottomIndex !== null ? ADULT_SIZES[bottomIndex].legLength : null;
  const legLengthMismatch =
    referenceLegLength !== null &&
    measures.legLength !== null &&
    Math.abs(measures.legLength - referenceLegLength) > 3;

  const adultCombinedRange =
    !junior && [topIndex, bottomIndex, setIndex].includes(4);
  const needsConsultation =
    outOfRange.length > 0 || adultCombinedRange || legLengthMismatch;
  const differentSizes =
    topIndex !== null && bottomIndex !== null && topIndex !== bottomIndex;
  const suggestedSize = (index: number | null): string | null => {
    if (index === null || index < 0 || (!junior && index === 4)) return null;
    return rows[index].size;
  };

  const topSize = suggestedSize(topIndex);
  const bottomSize = suggestedSize(bottomIndex);
  const setSize = suggestedSize(setIndex);
  const ready = !incomplete && !needsConsultation && setIndex !== null;

  const boundaryCheck = [
    ...(junior
      ? [
          {
            index: heightIndex,
            value: measures.height,
            dimension: "height" as const,
          },
        ]
      : []),
    { index: chestIndex, value: measures.chest, dimension: "chest" as const },
    { index: waistIndex, value: measures.waist, dimension: "waist" as const },
    { index: hipsIndex, value: measures.hips, dimension: "hips" as const },
  ];
  const nearBoundary = boundaryCheck.some(({ index, value, dimension }) => {
    if (!validIndex(index) || value === null || index >= rows.length - 1)
      return false;
    const range = junior
      ? JUNIOR_SIZES[index][dimension]
      : ADULT_SIZES[index][dimension as Exclude<RangeDimension, "height">];
    return range[1] - value <= 2;
  });

  useEffect(() => {
    onRecommendationChange?.({
      top: topSize,
      bottom: bottomSize,
      set: setSize,
      ready,
      hasDifferentSizes: differentSizes,
      needsConsultation,
    });
  }, [
    onRecommendationChange,
    topSize,
    bottomSize,
    setSize,
    ready,
    differentSizes,
    needsConsultation,
  ]);

  const results = [
    {
      title: "Bluza / kurtka",
      detail: junior ? "Wzrost + klatka piersiowa" : "Klatka piersiowa",
      index: topIndex,
    },
    {
      title: "Spodnie",
      detail: junior
        ? "Wzrost + pas + biodra"
        : "Pas + biodra · nogawka do sprawdzenia",
      index: bottomIndex,
    },
  ];

  const hasStartingMeasurement = junior
    ? measures.height !== null
    : measures.chest !== null;

  function switchCategory(nextCategory: Category) {
    setCategory(nextCategory);
    setValues(INITIAL_VALUES);
  }

  return (
    <section
      id="rozmiary"
      className="bg-club-bg scroll-mt-28 border-y border-white/10"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10">
          <div className="text-club-accent mb-4 flex items-center gap-2">
            <Ruler size={18} />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">
              Joma / Size Guide
            </span>
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase md:text-5xl">
            Dobierz swój <span className="text-club-accent">rozmiar.</span>
          </h2>

          <p className="mt-4 text-sm text-white/55">
            Wybierz kategorię i wprowadź wymiary zawodnika.
          </p>
        </div>

        <div
          className="bg-club-surface mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 p-2"
          role="group"
          aria-label="Tabela rozmiarów"
        >
          <button
            type="button"
            aria-pressed={junior}
            onClick={() => switchCategory("junior")}
            className={`flex-1 rounded-xl px-5 py-3 text-sm font-bold transition ${junior ? "bg-club-primary text-club-on-primary" : "text-white/70 hover:bg-white/10"}`}
          >
            Juniorzy · 6XS–XS
          </button>
          <button
            type="button"
            aria-pressed={!junior}
            onClick={() => switchCategory("adult")}
            className={`flex-1 rounded-xl px-5 py-3 text-sm font-bold transition ${!junior ? "bg-club-primary text-club-on-primary" : "text-white/70 hover:bg-white/10"}`}
          >
            Dorośli · S–3XL
          </button>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="bg-club-elevated min-w-0 rounded-3xl border border-white/10 p-4 sm:p-6 md:p-8">
            <div className="mb-7 flex items-center justify-between">
              <h3 className="text-lg font-bold">Wymiary zawodnika</h3>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
                cm
              </span>
            </div>
            <div className="grid min-w-0 gap-5 sm:grid-cols-2">
              {FIELDS.filter((field) =>
                junior ? field.key !== "legLength" : field.key !== "height",
              ).map((field) => (
                <label key={field.key} className="block min-w-0">
                  <span className="mb-2 flex items-center justify-between gap-2 text-sm font-semibold">
                    {field.label}
                  </span>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      max="250"
                      step={field.key === "legLength" ? "0.5" : "1"}
                      value={values[field.key]}
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.key]: event.target.value,
                        }))
                      }
                      placeholder="Wpisz wymiar"
                      className="bg-club-bg focus:border-club-accent w-full min-w-0 rounded-xl border border-white/15 px-4 py-4 pr-12 text-base font-semibold text-white outline-none placeholder:text-sm placeholder:font-normal placeholder:text-white/25"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-xs text-white/35">
                      cm
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setValues(INITIAL_VALUES)}
              className="mt-5 text-xs font-semibold text-white/50 underline underline-offset-4 hover:text-white"
            >
              Wyczyść wszystkie pomiary
            </button>
          </div>

          <div className="border-club-accent/20 bg-club-surface min-w-0 rounded-3xl border p-4 sm:p-6 md:p-8">
            <p className="text-club-accent mb-2 text-xs font-bold tracking-[0.2em] uppercase">
              Twój wynik
            </p>
            <h3 className="text-2xl font-black">Rekomendacja rozmiaru</h3>
            {!hasStartingMeasurement ? (
              <div className="mt-10 flex min-h-44 flex-col items-center justify-center gap-4 text-center">
                <Ruler
                  size={42}
                  strokeWidth={1.3}
                  className="text-club-accent/50"
                />
                <p className="max-w-xs text-sm leading-7 text-white/50">
                  {junior
                    ? "Zacznij od podania wzrostu zawodnika."
                    : "Zacznij od obwodu klatki piersiowej."}
                </p>
              </div>
            ) : (
              <div className="mt-7 space-y-4">
                {results.map((result) => (
                  <div
                    key={result.title}
                    className="bg-club-bg/60 flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-5"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold">{result.title}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {result.detail}
                      </p>
                    </div>
                    <span className="text-club-accent shrink-0 text-2xl font-black sm:text-3xl">
                      {result.index === null ? "—" : rows[result.index].size}
                    </span>
                  </div>
                ))}

                {setIndex !== null && (
                  <div className="border-club-accent/25 bg-club-accent/10 rounded-2xl border p-5">
                    <p className="text-club-accent text-xs font-bold tracking-wider uppercase">
                      Komplet w jednym rozmiarze
                    </p>
                    <p className="mt-2 text-4xl font-black">
                      {rows[setIndex].size}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-white/55">
                      Orientacyjny wariant do sprawdzenia przy przymiarce.
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
                      Pomiar poza zakresem tabeli ({outOfRange.join(", ")}).
                      Sprawdź go i skonsultuj rozmiar z dostawcą.
                    </p>
                  </div>
                )}
                {!junior && referenceLegLength !== null && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs leading-6 text-white/65">
                      Długość nogawki według tabeli dla rozmiaru spodni{" "}
                      {ADULT_SIZES[bottomIndex!].size}:
                      <span className="text-club-accent ml-1 font-bold">
                        {referenceLegLength.toLocaleString("pl-PL")} cm
                      </span>
                      .
                      {measures.legLength !== null &&
                        ` Twój pomiar: ${measures.legLength.toLocaleString("pl-PL")} cm.`}
                    </p>
                  </div>
                )}
                {legLengthMismatch && (
                  <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <AlertTriangle
                      size={20}
                      className="shrink-0 text-amber-300"
                    />
                    <p className="text-xs leading-6 text-amber-100">
                      Długość nogawki różni się o ponad 3 cm od orientacyjnej
                      wartości Joma. Sprawdź długość spodni podczas przymiarki;
                      rozmiar według pasa i bioder może nadal być właściwy.
                    </p>
                  </div>
                )}
                {adultCombinedRange && (
                  <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                    <AlertTriangle
                      size={20}
                      className="shrink-0 text-amber-300"
                    />
                    <p className="text-xs leading-6 text-amber-100">
                      Producent podaje wspólny zakres XXL–3XL. Wybierz XXL lub
                      3XL ręcznie dopiero po przymiarce albo konsultacji.
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
                      Wymiary wskazują różne rozmiary góry i dołu. Sprawdź
                      możliwość zamówienia kompletu w jednym rozmiarze.
                    </p>
                  </div>
                )}
                {nearBoundary && (
                  <div className="flex gap-3 rounded-xl border border-white/15 bg-white/5 p-4">
                    <AlertTriangle
                      size={20}
                      className="text-club-accent shrink-0"
                    />
                    <p className="text-xs leading-6 text-white/65">
                      Co najmniej jeden wymiar jest blisko górnej granicy
                      rozmiaru. Warto porównać kolejny rozmiar.
                    </p>
                  </div>
                )}
                {incomplete && outOfRange.length === 0 && (
                  <p className="text-xs leading-6 text-white/45">
                    Wynik wstępny — uzupełnij wszystkie wymagane wymiary.
                  </p>
                )}
                {ready &&
                  !differentSizes &&
                  !nearBoundary &&
                  !legLengthMismatch && (
                    <div className="text-club-accent flex items-center gap-2 text-xs">
                      <CheckCircle2 size={17} /> Wymiary mieszczą się w
                      zakresach sugerowanego rozmiaru.
                    </div>
                  )}
              </div>
            )}

            <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/45">
              Sugerowany rozmiar warto potwierdzić przymiarką.
            </p>
          </div>
        </div>

        <details className="bg-club-elevated mt-6 overflow-hidden rounded-2xl border border-white/10">
          <summary className="hover:text-club-accent cursor-pointer px-6 py-5 text-sm font-semibold">
            Pokaż pełną tabelę rozmiarów Joma ({junior ? "junior" : "dorośli"})
          </summary>
          <div className="overflow-x-auto px-4 pb-6 md:px-6">
            {junior ? (
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
                  {JUNIOR_SIZES.map((row) => (
                    <tr key={row.size} className="border-b border-white/5">
                      <td className="text-club-accent p-3 font-bold">
                        {row.size}
                      </td>
                      <td className="p-3">{row.age}</td>
                      <td className="p-3">{formatRange(row.height)}</td>
                      <td className="p-3">{formatRange(row.chest)}</td>
                      <td className="p-3">{formatRange(row.waist)}</td>
                      <td className="p-3">{formatRange(row.hips)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[490px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/15 text-xs text-white/45">
                    <th className="p-3">Rozmiar</th>
                    <th className="p-3">Klatka</th>
                    <th className="p-3">Pas</th>
                    <th className="p-3">Biodra</th>
                    <th className="p-3">Dł. nogawki*</th>
                  </tr>
                </thead>
                <tbody>
                  {ADULT_SIZES.map((row) => (
                    <tr key={row.size} className="border-b border-white/5">
                      <td className="text-club-accent p-3 font-bold">
                        {row.size}
                      </td>
                      <td className="p-3">{formatRange(row.chest)}</td>
                      <td className="p-3">{formatRange(row.waist)}</td>
                      <td className="p-3">{formatRange(row.hips)}</td>
                      <td className="p-3">{row.legLength}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="mt-3 text-xs text-white/40">
              Wszystkie wymiary w centymetrach.{" "}
              {junior
                ? "Tabela juniorskiej odzieży przekazana przez klub."
                : "* Długość nogawki od kroku jest podana jako orientacyjna wartość, a nie zakres. Kalkulator porównuje ją z pomiarem, lecz rozmiar dobiera z pasa i bioder. Zakres XXL–3XL jest wspólny."}
            </p>
          </div>
        </details>
      </div>
    </section>
  );
}
