"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Nie udało się zalogować.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd logowania.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-club-bg px-5 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-club-surface p-7 md:p-9">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-club-accent/10 text-club-accent">
            <LockKeyhole size={27} />
          </div>

          <div>
            <p className="text-xs font-bold tracking-widest text-club-accent uppercase">
              Górnik Radlin
            </p>
            <h1 className="mt-1 text-2xl font-black">Panel trenerów</h1>
          </div>
        </div>

        <p className="mb-8 text-sm leading-7 text-white/55">
          Zaloguj się, aby zarządzać zgłoszeniami odzieży klubowej.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="admin-username"
              className="mb-2 block text-sm font-semibold"
            >
              Login
            </label>

            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Login administratora"
              className="w-full rounded-xl border border-white/15 bg-club-bg px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-club-accent"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-semibold"
            >
              Hasło
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Wpisz hasło"
              className="w-full rounded-xl border border-white/15 bg-club-bg px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-club-accent"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-club-primary px-6 py-4 text-sm font-extrabold text-club-on-primary transition hover:bg-club-primary-hover disabled:opacity-50"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-7 flex items-center gap-2 border-t border-white/10 pt-6 text-xs text-white/40">
          <ShieldCheck size={16} className="text-club-accent" />
          Dostęp wyłącznie dla osób upoważnionych przez klub.
        </div>
      </div>
    </main>
  );
}
