"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageCircle, Ruler, X } from "lucide-react";

type Step = 0 | 1 | 2 | 3;

const tips = {
  1: {
    title: "Wybierz pakiet",
    description:
      "Wybierz Pakiet I lub II. Kliknij zdjęcie produktu, aby zobaczyć więcej ujęć.",
    Icon: MessageCircle,
  },
  2: {
    title: "Sprawdź rozmiar",
    description:
      "Skorzystaj z kalkulatora lub tabeli rozmiarów Joma, aby dobrać odzież.",
    Icon: Ruler,
  },
  3: {
    title: "Złóż zamówienie",
    description:
      "Wybierz trzy rozmiary dla każdego zawodnika, uzupełnij dane i sprawdź zamówienie.",
    Icon: CheckCircle2,
  },
} as const;

export default function OrderGuide() {
  const [step, setStep] = useState<Step>(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function updateStep() {
      const products = document.getElementById("produkty");
      const sizes = document.getElementById("rozmiary");
      const order = document.getElementById("zamowienie");
      const footer = document.querySelector("footer");
      const summary = document.getElementById("podsumowanie");
      if (!products || !sizes || !order) {
        setStep(0);
        return;
      }

      const position = window.innerHeight * 0.4;

      if (
        (summary && summary.getBoundingClientRect().top <= position) ||
        (footer && footer.getBoundingClientRect().top <= position)
      ) {
        setStep(0);
      } else if (order.getBoundingClientRect().top <= position) {
        setStep(3);
      } else if (sizes.getBoundingClientRect().top <= position) {
        setStep(2);
      } else if (products.getBoundingClientRect().top <= position) {
        setStep(1);
      } else {
        setStep(0);
      }
    }

    updateStep();

    window.addEventListener("scroll", updateStep, { passive: true });
    window.addEventListener("resize", updateStep);

    return () => {
      window.removeEventListener("scroll", updateStep);
      window.removeEventListener("resize", updateStep);
    };
  }, []);

  if (dismissed || step === 0) {
    return null;
  }

  const tip = tips[step];

  const shortDescriptions = {
    1: "Kliknij wybrany zestaw",
    2: "Sprawdź rozmiary odzieży",
    3: "Uzupełnij dane zawodnika",
  } as const;

  const Icon = tip.Icon;

  return (
    <aside className="bg-club-surface border-club-accent/40 fixed right-3 bottom-3 z-40 w-[235px] rounded-xl border px-3 py-2.5 text-white shadow-xl sm:right-6 sm:bottom-6 sm:w-[260px]">
      <div className="flex items-center gap-2.5">
        <Icon size={18} className="text-club-accent shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-club-accent text-[10px] font-bold">
              {step}/3
            </span>
            <span className="text-xs font-bold">{tip.title}</span>
          </div>

          <p className="mt-0.5 text-[11px] text-white/60">
            {shortDescriptions[step]}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Zamknij podpowiedzi"
          className="shrink-0 rounded-md p-1 text-white/50 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </aside>
  );
}
