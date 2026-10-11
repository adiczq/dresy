"use client";
import OrderForm from "@/components/OrderForm";
import SizeAdvisor, { type SizeRecommendation } from "@/components/SizeAdvisor";
import { useState } from "react";
import { ArrowRight, Check, Shirt, ShoppingBag, Wind } from "lucide-react";
import Image from "next/image";
import ProductGallery from "@/components/ProductGallery";

type ProductId = "tracksuit" | "jacket";

const products = [
  {
    id: "tracksuit" as ProductId,
    number: "01",
    name: "Komplet dresowy",
    model: "JOMA ACADEMY IV",
    description:
      "Bluza i spodnie treningowe. Wygodny komplet na treningi, mecze i wyjazdy klubowe.",
    icon: Shirt,
    items: ["Bluza", "Spodnie"],
  },
  {
    id: "jacket" as ProductId,
    number: "02",
    name: "Kurtka treningowa",
    model: "JOMA · MODEL DO POTWIERDZENIA",
    description:
      "Dodatkowa warstwa na chłodniejsze dni, treningi i mecze wyjazdowe.",
    icon: Wind,
    items: ["Kurtka"],
  },
];

export default function Home() {
  const [galleryProduct, setGalleryProduct] = useState<ProductId | null>(null);
  const [selected, setSelected] = useState<ProductId[]>(["tracksuit"]);
  const [recommendation, setRecommendation] = useState<SizeRecommendation>({
    top: null,
    bottom: null,
    set: null,
    ready: false,
    hasDifferentSizes: false,
    needsConsultation: false,
  });
  const toggleProduct = (id: ProductId) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <main className="bg-club-bg min-h-screen text-white">
      {/* HEADER */}
      <header className="bg-club-bg/95 sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="border-club-accent/30 bg-club-accent/10 text-club-accent flex h-11 w-11 items-center justify-center rounded-xl border font-black">
              GR
            </div>
            <div>
              <p className="text-sm font-black tracking-[0.12em]">
                GÓRNIK RADLIN
              </p>
              <p className="text-[10px] tracking-[0.2em] text-white/45 uppercase">
                Odzież klubowa
              </p>
            </div>
          </a>

          <a
            href="#produkty"
            className="bg-club-primary text-club-on-primary hover:bg-club-primary-hover flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition"
          >
            Zamów odzież
            <ArrowRight size={15} />
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="bg-club-accent/10 pointer-events-none absolute top-[-120px] right-[-120px] h-[420px] w-[420px] rounded-full blur-[110px]" />

        <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
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
              Zamów odzież treningową Górnika Radlin. Wybierz produkty, dopasuj
              rozmiar i złóż zamówienie bez zbędnych wiadomości i formularzy
              papierowych.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#produkty"
                className="bg-club-primary text-club-on-primary hover:bg-club-primary-hover inline-flex items-center gap-3 rounded-xl px-6 py-4 text-sm font-extrabold transition"
              >
                Zobacz kolekcję
                <ArrowRight size={18} />
              </a>
            </div>
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

            <div className="absolute right-7 bottom-7 left-7 flex items-end justify-between">
              <div>
                <p className="text-xs tracking-widest text-white/40">
                  OFFICIAL CLUB COLLECTION
                </p>
                <p className="mt-1 text-lg font-black">GÓRNIK RADLIN</p>
              </div>
              <span className="text-club-accent text-3xl font-black">01.</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="produkty"
        className="mx-auto max-w-7xl scroll-mt-28 px-5 py-20 md:px-8"
      >
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-club-accent mb-3 text-xs font-bold tracking-[0.25em]">
              KOLEKCJA
            </p>
            <h2 className="text-3xl font-black tracking-tight uppercase md:text-5xl">
              Wybierz odzież
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/50">
              Zaznacz produkty, które chcesz zamówić. Możesz wybrać komplet
              dresowy, kurtkę albo oba produkty.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/55">
            <ShoppingBag size={18} />
            Wybrano:{" "}
            <span className="text-club-accent font-bold">
              {selected.length}
            </span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {products.map((product) => {
            const active = selected.includes(product.id);
            const isTracksuit = product.id === "tracksuit";

            return (
              <div key={product.id} className="group relative">
                <button
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  aria-pressed={active}
                  className={`block h-full w-full overflow-hidden rounded-3xl border text-left transition-all duration-200 ${
                    active
                      ? "border-club-accent bg-club-elevated"
                      : "bg-club-elevated border-white/10 hover:border-white/30"
                  }`}
                >
                  {/* ZDJĘCIE PRODUKTU */}
                  <div className="bg-club-surface relative flex h-64 items-center justify-center overflow-hidden border-b border-white/10">
                    {/* NUMER PRODUKTU */}
                    <div className="absolute top-6 left-6 z-10 text-sm font-bold tracking-widest text-white/35">
                      {product.number} / JOMA
                    </div>

                    {/* ZAZNACZENIE */}
                    <div className="absolute top-6 right-6 z-10">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                          active
                            ? "border-club-primary bg-club-primary text-white"
                            : "border-club-accent/70 bg-club-accent/10 text-club-accent"
                        }`}
                      >
                        {active ? <Check size={19} /> : null}
                      </div>
                    </div>

                    {/* DRES — PRAWDZIWE ZDJĘCIE */}

                    <Image
                      src={
                        isTracksuit
                          ? "/images/joma-academy-iv_1.png"
                          : "/images/105301.700_1.png"
                      }
                      alt={
                        isTracksuit
                          ? "Joma Academy IV — komplet dresowy"
                          : "Joma 105301.700 — niebieska kurtka treningowa"
                      }
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain p-5 transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* INFORMACJE O PRODUKCIE */}
                  <div className="p-7">
                    <p className="text-club-accent text-xs font-bold tracking-[0.2em]">
                      {product.model}
                    </p>

                    <h3 className="mt-3 text-2xl font-black">{product.name}</h3>

                    <p className="mt-3 min-h-14 text-sm leading-6 text-white/50">
                      {product.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {product.items.map((item) => (
                        <span
                          key={item}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/65"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-6">
                      <span
                        className={`text-sm font-bold ${
                          active ? "text-club-accent" : "text-white/75"
                        }`}
                      >
                        {active ? "Wybrano produkt" : "Wybierz produkt"}
                      </span>

                      <ArrowRight
                        size={18}
                        className={
                          active ? "text-club-accent" : "text-white/50"
                        }
                      />
                    </div>
                  </div>
                </button>

                {/* OSOBNY PRZYCISK GALERII */}

                <button
                  type="button"
                  onClick={() => setGalleryProduct(product.id)}
                  className="border-club-accent/40 bg-club-bg/95 text-club-accent hover:bg-club-surface absolute top-52 right-5 z-20 rounded-full border px-4 py-2 text-xs font-bold shadow-lg transition"
                >
                  Zobacz {isTracksuit ? 6 : 5} zdjęć
                </button>
              </div>
            );
          })}
        </div>

        {/* OKNO GALERII */}

        {galleryProduct && (
          <ProductGallery
            product={galleryProduct}
            onClose={() => setGalleryProduct(null)}
          />
        )}
      </section>
      <SizeAdvisor onRecommendationChange={setRecommendation} />

      {/* ORDER FORM */}
      <OrderForm selectedProducts={selected} recommendation={recommendation} />

      {/* FOOTER */}
      <footer className="bg-club-bg border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-5 py-8 text-xs text-white/40 md:flex-row md:px-8">
          <span>© 2026 Górnik Radlin — zamówienia klubowe</span>
          <span>Projekt w przygotowaniu · ADICZQ</span>
        </div>
      </footer>
    </main>
  );
}
