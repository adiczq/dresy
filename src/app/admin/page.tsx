import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogOut, ShieldCheck } from "lucide-react";

import OrdersDashboard from "@/components/admin/OrdersDashboard";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminOrders } from "@/lib/admin-orders";

async function AdminContent() {
  // Najpierw sprawdzamy uprawnienia.
  const session = await getAdminSession();

  if (session.isAdmin !== true) {
    redirect("/admin/login");
  }

  // Dopiero po zalogowaniu odczytujemy MongoDB.
  const { ordersCount, rows } = await getAdminOrders();

  return (
    <main className="min-h-screen bg-club-bg text-white">
      <header className="border-b border-white/10 bg-club-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <p className="text-xs font-bold tracking-widest text-club-accent uppercase">
              Górnik Radlin
            </p>

            <h1 className="mt-1 text-xl font-black">Panel trenerów</h1>
          </div>

          <form action="/api/admin/logout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-semibold hover:bg-white/5"
            >
              <LogOut size={16} />
              Wyloguj
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-club-accent">
            <ShieldCheck size={17} />
            Sesja administratora aktywna
          </div>

          <h2 className="text-3xl font-black uppercase md:text-4xl">
            Zamówienia klubowe
          </h2>

          <p className="mt-4 text-sm leading-7 text-white/50">
            Lista zawodników, numery odzieży, rozmiary i partie dla dostawcy.
          </p>
        </div>

        <OrdersDashboard ordersCount={ordersCount} rows={rows} />
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-club-bg text-sm text-white/60">
          Wczytywanie zgłoszeń...
        </main>
      }
    >
      <AdminContent />
    </Suspense>
  );
}
