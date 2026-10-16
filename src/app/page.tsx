"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import SizeAdvisor, { type SizeRecommendation } from "@/components/SizeAdvisor";
import OrderForm from "@/components/OrderForm";
import ProductGallery from "@/components/ProductGallery";
import OrderGuide from "@/components/OrderGuide";
import { PACKAGES, formatPrice, type PackageId } from "@/lib/products";

export default function Home() {
  const [selectedPackage, setSelectedPackage] =
    useState<PackageId>("package_1");
  const [galleryProduct, setGalleryProduct] = useState<
    "pants" | "sweatshirt" | "jacket" | "jacket_basic" | null
  >(null);
  const [recommendation, setRecommendation] = useState<SizeRecommendation>({
    top: null,
    bottom: null,
    set: null,
    ready: false,
    hasDifferentSizes: false,
    needsConsultation: false,
  });
  return (
    <main className="bg-club-bg min-h-screen text-white">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="bg-club-accent/10 pointer-events-none absolute top-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full blur-[110px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-12 md:gap-14 md:px-8 md:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="border-club-accent/25 bg-club-accent/10 text-club-accent mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-wider">
              <span className="bg-club-primary h-2 w-2 rounded-full" />
              KOLEKCJA KLUBOWA 2026/27
            </div>

            <h1 className="max-w-3xl text-5xl leading-[0.98] font-black tracking-[-0.055em] uppercase md:text-7xl">
              JEDNA
              <br />
              DRUŻYNA.
              <br />
              <span className="text-club-accent">JEDEN STYL.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-8 text-white/60">
              Zamów odzież treningową Górnika Radlin. Wybierz pakiet, dopasuj
              rozmiary i złóż zamówienie bez zbędnych wiadomości i formularzy
              papierowych.
            </p>
          </div>

          {/* HERO VISUAL */}
          <div className="bg-club-surface relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 p-8 md:min-h-[470px]">
            <div className="absolute inset-0 [background-image:linear-gradient(rgba(163,230,53,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.12)_1px,transparent_1px)] [background-size:36px_36px] opacity-20" />

            <div className="text-club-accent absolute top-7 left-7 text-xs font-bold tracking-[0.25em]">
              TEAMWEAR / 2026
            </div>

            <div className="relative h-64 w-full md:h-[350px]">
              <Image
                src="/images/joma-shirt.png"
                alt="Niebieska koszulka treningowa Joma"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-contain drop-shadow-[0_16px_32px_rgba(0,0,0,0.28)]"
              />
            </div>

            <div className="absolute right-7 bottom-7 left-7">
              <p className="text-xs tracking-widest text-white/40">
                OFFICIAL CLUB COLLECTION
              </p>
              <p className="mt-1 text-lg font-black">GÓRNIK RADLIN</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="produkty"
        className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 md:px-8 md:py-20"
      >
        <p className="text-club-accent mb-3 text-xs font-bold tracking-[0.25em]">
          OFERTA KLUBOWA
        </p>
        <h2 className="text-3xl font-black tracking-tight uppercase md:text-5xl">
          Wybierz pakiet
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
          Wybierz jeden z dwóch kompletnych pakietów. Każdy obejmuje spodnie,
          bluzę i kurtkę. Cena po dofinansowaniu to kwota do zapłaty przez
          rodzica.
        </p>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {(["package_1", "package_2"] as const).map((id) => {
            const pack = PACKAGES[id];
            const selected = selectedPackage === id;

            return (
              <div
                key={id}
                className={`bg-club-surface overflow-hidden rounded-3xl border ${
                  selected ? "border-club-accent" : "border-white/15"
                }`}
              >
                {/* Wybór pakietu */}
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedPackage(id)}
                  className="w-full px-5 pt-5 text-left sm:px-7 sm:pt-7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-club-accent text-xs font-bold tracking-widest">
                        JOMA / KOLEKCJA KLUBOWA
                      </p>
                      <h3 className="mt-2 text-2xl font-black">{pack.label}</h3>
                    </div>

                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-club-primary bg-club-primary"
                          : "border-club-accent/70 bg-club-accent/10"
                      }`}
                    >
                      {selected && <Check size={19} />}
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2">
                    <div>
                      <p className="text-xs text-white/50">
                        Cena po dofinansowaniu
                      </p>
                      <p className="text-club-accent text-4xl font-black">
                        {formatPrice(pack.price)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/50">Cena katalogowa</p>
                      <p className="text-xl font-semibold text-white/55 line-through">
                        {formatPrice(pack.catalogPrice)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-white/55">
                    Dofinansowanie:{" "}
                    {formatPrice(pack.catalogPrice - pack.price)}
                  </p>
                </button>

                {/* Zdjęcia — kliknięcie otwiera galerię */}
                <div className="mt-6 grid grid-cols-3 gap-2 px-5 sm:gap-3 sm:px-7">
                  {[
                    {
                      id: "pants" as const,
                      label: "Spodnie",
                      image: "/images/100761.331_1.png",
                    },
                    {
                      id: "sweatshirt" as const,
                      label: "Bluza",
                      image: "/images/100947.703_1.png",
                    },
                    {
                      id: pack.jacketId,
                      label: id === "package_1" ? "Ortalion I" : "Ortalion II",
                      image:
                        id === "package_1"
                          ? "/images/104796.700_1.png"
                          : "/images/105301.700_1.png",
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGalleryProduct(item.id)}
                      aria-label={`Zobacz zdjęcia: ${item.label}`}
                      className="group bg-club-bg hover:border-club-accent/60 hover:bg-club-accent/5 focus-visible:outline-club-accent flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-white/10 p-2 text-center transition focus-visible:outline-2"
                    >
                      <div className="relative h-24 w-full">
                        <Image
                          src={item.image}
                          alt={item.label}
                          fill
                          sizes="(max-width: 640px) 30vw, 180px"
                          className="object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>

                      <span className="text-xs font-semibold">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Przycisk wyboru pakietu */}
                <div className="px-5 pb-5 sm:px-7 sm:pb-7">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedPackage(id)}
                    className="text-club-accent mt-6 flex w-full items-center justify-between border-t border-white/10 pt-5 text-left text-sm font-bold"
                  >
                    {selected ? "Wybrano ten pakiet" : "Wybierz ten pakiet"}
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-xs leading-6 text-white/45">
          Numery katalogowe odzieży są uwzględniane w zestawieniu dla trenerów.
          Spodnie i bluzę dobierzesz w niezależnych rozmiarach.
        </p>
        {galleryProduct && (
          <ProductGallery
            product={galleryProduct}
            onClose={() => setGalleryProduct(null)}
          />
        )}
      </section>
      <SizeAdvisor onRecommendationChange={setRecommendation} />
      <OrderForm
        selectedPackage={selectedPackage}
        recommendation={recommendation}
      />
      <OrderGuide />
      <footer className="bg-club-bg border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-xs text-white/40 md:flex-row md:px-8">
          <span>© 2026 Górnik Radlin — zamówienia klubowe</span>
          <span>Projekt w przygotowaniu · ADICZQ</span>
        </div>
      </footer>
    </main>
  );
}
