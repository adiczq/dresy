import { CheckCircle2, Users } from "lucide-react";
import { getPlayerInitials } from "@/lib/initials";

type PlayerDetailsProps = {
  idPrefix?: string;
  playerName: string;
  setPlayerName: (value: string) => void;
  group: string;
  setGroup: (value: string) => void;
  noInitials: boolean;
  setNoInitials: (value: boolean) => void;
};

export default function PlayerDetails({
  idPrefix = "player-1",
  playerName,
  setPlayerName,
  group,
  setGroup,
  noInitials,
  setNoInitials,
}: PlayerDetailsProps) {
  const playerInitials = getPlayerInitials(playerName);

  return (
    <div className="w-full min-w-0">
      <div className="mb-5 flex items-center gap-3">
        <Users size={21} className="text-club-accent" />
        <h3 className="text-lg font-bold">Dane zawodnika</h3>
      </div>
      <div className="bg-club-bg mb-6 flex items-center gap-4 rounded-2xl border border-white/10 p-4">
        <div className="bg-club-primary text-club-on-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black transition-all">
          {noInitials ? "—" : playerInitials || "?"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold">
            {playerName.trim() || "Imię i nazwisko zawodnika"}
          </p>
          <p className="mt-1 text-xs text-white/45">
            {noInitials
              ? "Bez nadruku inicjałów"
              : playerInitials
                ? `Inicjały zawodnika: ${playerInitials}`
                : "Wpisz dane, aby zobaczyć inicjały"}
          </p>
        </div>
      </div>
      <label className="mb-6 inline-flex cursor-pointer items-center gap-2 text-xs text-white/50">
        <input
          type="checkbox"
          checked={noInitials}
          onChange={(event) => setNoInitials(event.target.checked)}
          className="accent-club-accent h-3.5 w-3.5"
        />
        Bez inicjałów
      </label>
      <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor={`${idPrefix}-player-name`}
            className="mb-2 block text-sm font-semibold"
          >
            Imię i nazwisko zawodnika
          </label>
          <input
            id={`${idPrefix}-player-name`}
            required
            maxLength={100}
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Np. Jan Kowalski"
            className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>

        <fieldset className="min-w-0 sm:col-span-2">
          <legend className="mb-3 text-sm font-semibold">
            Grupa treningowa
          </legend>
          <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
            {["Żaki", "Trampkarze"].map((name) => {
              const active = group === name;
              return (
                <label
                  key={name}
                  className={`focus-within:ring-club-accent flex min-w-0 cursor-pointer items-center justify-between gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors focus-within:ring-2 sm:px-4 sm:py-4 sm:text-sm ${
                    active
                      ? "border-club-accent bg-club-accent/10 text-club-accent"
                      : "bg-club-bg hover:border-club-accent/50 border-white/15 text-white"
                  }`}
                >
                  <input
                    type="radio"
                    name={`${idPrefix}-training-group`}
                    value={name}
                    checked={active}
                    onChange={() => setGroup(name)}
                    required
                    className="sr-only"
                  />
                  {name}
                  {active && <CheckCircle2 size={18} />}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </div>
  );
}
