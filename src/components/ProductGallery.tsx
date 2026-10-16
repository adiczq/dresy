"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const galleries = {
  pants: {
    code: "JOMA / SPODNIE",
    title: "Spodnie treningowe",

    description: [
      "Dopasowane spodnie treningowe z kieszeniami oraz zamkami błyskawicznymi u dołu nogawek, które ułatwiają zakładanie i zdejmowanie.",
      "Elastyczny pas ze sznurkiem pozwala regulować dopasowanie. Po bokach znajdują się nadrukowane logotypy Joma.",
    ],

    photos: [
      "/images/100761.331_1.png",
      "/images/100761.331_2.png",
      "/images/100761.331_3.png",
      "/images/100761.331_4.png",
      "/images/100761.331_5.png",
      "/images/100761.331_6.png",
      "/images/100761.331_7.png",
    ],
  },
  sweatshirt: {
    code: "JOMA / BLUZA",
    title: "Bluza treningowa",

    description: [
      "Ciepła bluza treningowa przeznaczona do aktywności sportowej w chłodniejsze dni. Zapewnia komfort oraz swobodę ruchów.",
      "Posiada krótki zamek z osłoną, ściągacze przy mankietach i u dołu oraz przesunięte szwy z przodu, poprawiające dopasowanie.",
      "Miękki materiał zapewnia izolację termiczną i pomaga utrzymać komfort podczas treningu.",
    ],

    photos: [
      "/images/100947.703_1.png",
      "/images/100947.703_2.png",
      "/images/100947.703_3.png",
    ],
  },

  jacket: {
    code: "JOMA / 105301.700",
    title: "Kurtka treningowa",

    description: [
      "Wygodna kurtka przeciwdeszczowa przeznaczona do aktywności sportowej w zimnych, deszczowych i wietrznych warunkach.",
      "Wyposażona w wodoodporny zamek na całej długości, ergonomiczny kaptur chowany w kołnierzu, elastyczne mankiety oraz kieszenie zapinane na zamki.",
      "Lekki, wodoodporny materiał chroni przed deszczem i wiatrem. Technologia Micro-Mesh pomaga odprowadzać nadmiar wilgoci i poprawia komfort podczas wysiłku.",
    ],

    photos: [
      "/images/105301.700_1.png",
      "/images/105301.700_2.png",
      "/images/105301.700_3.png",
      "/images/105301.700_4.png",
      "/images/105301.700_5.png",
    ],
  },
  jacket_basic: {
    code: "JOMA / 104796.700",
    title: "Kurtka przeciwdeszczowa",

    description: [
      "Lekka, wodoodporna kurtka uniseksowa przeznaczona do aktywności sportowej w chłodną, deszczową i wietrzną pogodę.",
      "Posiada zamek na całej długości, kaptur chowany w kołnierzu, kieszenie oraz elastyczne mankiety chroniące przed przedostawaniem się zimna i wody.",
      "Technologia Micro-Mesh wspomaga wentylację w miejscach zwiększonego pocenia. Kurtka łączy ochronę przed deszczem z oddychalnością materiału.",
    ],

    photos: [
      "/images/104796.700_1.png",
      "/images/104796.700_2.png",
      "/images/104796.700_3.png",
      "/images/104796.700_4.png",
      "/images/104796.700_5.png",
      "/images/104796.700_6.png",
    ],
  },
};

type Props = {
  product: "pants" | "sweatshirt" | "jacket" | "jacket_basic";
  onClose: () => void;
};

export default function ProductGallery({ product, onClose }: Props) {
  const { code, title, photos, description } = galleries[product];

  const [activeIndex, setActiveIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((index) => (index + 1) % photos.length);
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);

      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    };
  }, [onClose, photos.length]);

  function previousPhoto() {
    setActiveIndex((index) => (index - 1 + photos.length) % photos.length);
  }

  function nextPhoto() {
    setActiveIndex((index) => (index + 1) % photos.length);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
      {/* Tło zamykające galerię */}
      <button
        type="button"
        aria-label="Zamknij galerię"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-title"
        className="bg-club-surface relative z-10 max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/15 shadow-2xl"
      >
        {/* Nagłówek */}
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-club-accent text-xs font-bold tracking-widest uppercase">
              {code}
            </p>

            <h2
              id="gallery-title"
              className="mt-1 text-lg font-black text-white"
            >
              {title}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Zamknij galerię"
            className="rounded-xl border border-white/15 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Główne zdjęcie */}
        <div className="bg-club-surface relative flex h-[42dvh] min-h-[220px] items-center justify-center sm:h-[55vh] sm:max-h-[570px]">
          <Image
            src={photos[activeIndex]}
            alt={`${title} — zdjęcie ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-contain p-4"
          />

          <button
            type="button"
            onClick={previousPhoto}
            aria-label="Poprzednie zdjęcie"
            className="bg-club-bg/90 hover:bg-club-primary absolute top-1/2 left-3 -translate-y-1/2 rounded-full p-3 text-white transition"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            type="button"
            onClick={nextPhoto}
            aria-label="Następne zdjęcie"
            className="bg-club-bg/90 hover:bg-club-primary absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-3 text-white transition"
          >
            <ChevronRight size={22} />
          </button>

          <span className="bg-club-bg/90 absolute right-4 bottom-3 rounded-full px-3 py-1.5 text-xs font-semibold text-white">
            {activeIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Miniatury */}
        <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-7 sm:gap-3 sm:p-5">
          {photos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Pokaż zdjęcie ${index + 1}`}
              aria-pressed={activeIndex === index}
              className={`bg-club-surface relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                activeIndex === index
                  ? "border-club-accent"
                  : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              <Image
                src={photo}
                alt={`Miniatura ${index + 1}`}
                fill
                sizes="(max-width: 640px) 16vw, 110px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>

        {/* Rozwijany opis produktu */}
        <details className="group border-t border-white/10">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-white transition hover:bg-white/5 [&::-webkit-details-marker]:hidden">
            <span>Opis produktu</span>

            <ChevronRight
              size={18}
              className="text-club-accent transition-transform group-open:rotate-90"
            />
          </summary>

          <div className="space-y-3 px-5 pb-5">
            {description.map((paragraph) => (
              <p
                key={paragraph}
                className="text-xs leading-6 text-white/65 sm:text-sm"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
