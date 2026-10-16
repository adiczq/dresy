import { Users } from "lucide-react";
import { trainingGroups } from "@/lib/training-groups";

type PlayerDetailsProps = {
  idPrefix?: string;
  playerName: string;
  setPlayerName: (value: string) => void;
  group: string;
  setGroup: (value: string) => void;
};

{
  trainingGroups.map((trainingGroup) => (
    <option key={trainingGroup.value} value={trainingGroup.value}>
      {trainingGroup.label}
    </option>
  ));
}

export default function PlayerDetails({
  idPrefix = "player-1",
  playerName,
  setPlayerName,
  group,
  setGroup,
}: PlayerDetailsProps) {
  return (
    <div className="w-full min-w-0">
      <div className="mb-5 flex items-center gap-3">
        <Users size={21} className="text-club-accent" />
        <h3 className="text-lg font-bold">Dane zawodnika</h3>
      </div>

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
