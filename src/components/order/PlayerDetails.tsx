import { Users } from "lucide-react";
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

const trainingGroups = [
  { value: "Żaki 2019", label: "Żaki 2019" },
  { value: "Żaki 2018", label: "Żaki 2018" },
  { value: "Orlik 2017", label: "Orlik 2017" },
  { value: "Orlik 2017 II", label: "Orlik 2017 II" },
  { value: "Orlik 2016", label: "Orlik 2016" },
  { value: "Trampkarze 2013", label: "Trampkarze 2013" },
  { value: "Junior Młodszy 2010", label: "Junior Młodszy 2010" },
];

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

      <div className="bg-club-bg mb-6 flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 p-4">
        <div className="bg-club-primary text-club-on-primary flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black transition-all">
          {noInitials ? "—" : playerInitials || "?"}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold">
            {playerName.trim() || "Imię i nazwisko zawodnika"}
          </p>
          <p className="mt-1 text-xs break-words text-white/45">
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
        <div className="min-w-0 sm:col-span-2">
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
            className="bg-club-bg focus:border-club-accent w-full min-w-0 rounded-xl border border-white/15 px-4 py-4 text-sm text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor={`${idPrefix}-training-group`}
            className="mb-3 block text-sm font-semibold"
          >
            Grupa treningowa
          </label>

          <select
            id={`${idPrefix}-training-group`}
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            required
            className="bg-club-bg focus:border-club-accent w-full min-w-0 rounded-xl border border-white/15 px-4 py-4 text-sm text-white outline-none"
          >
            <option value="">Wybierz grupę zawodnika</option>

            {trainingGroups.map((trainingGroup) => (
              <option key={trainingGroup.value} value={trainingGroup.value}>
                {trainingGroup.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
