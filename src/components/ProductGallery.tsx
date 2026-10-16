"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const galleries = {
  pants: {
    code: "JOMA / SPODNIE",
    title: "Spodnie treningowe",
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
    photos: [
      "/images/100947.703_1.png",
      "/images/100947.703_2.png",
      "/images/100947.703_3.png",
    ],
  },

  jacket: {
    code: "JOMA / 105301.700",
    title: "Kurtka treningowa",
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
  const { code, title, photos } = galleries[product];

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
        className="bg-club-surface relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
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
        <div className="bg-club-surface relative flex h-[55vh] max-h-[570px] min-h-[260px] items-center justify-center">
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
      </div>
    </div>
  );
}
