type ParentDetailsProps = {
  parentName: string;
  setParentName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
};

export default function ParentDetails({
  parentName,
  setParentName,
  phone,
  setPhone,
}: ParentDetailsProps) {
  return (
    <div>
      <h3 className="mb-5 text-lg font-bold">Dane rodzica / opiekuna</h3>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="parent-name" className="mb-2 block text-sm font-semibold">
            Imię i nazwisko
          </label>
          <input
            id="parent-name"
            required
            maxLength={100}
            value={parentName}
            onChange={(event) => setParentName(event.target.value)}
            placeholder="Imię i nazwisko"
            className="w-full rounded-xl border border-white/15 bg-club-bg px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-club-accent"
          />
        </div>
        <div>
          <label htmlFor="parent-phone" className="mb-2 block text-sm font-semibold">
            Numer telefonu
          </label>
          <input
            id="parent-phone"
            type="tel"
            required
            maxLength={25}
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Np. 500 600 700"
            className="w-full rounded-xl border border-white/15 bg-club-bg px-4 py-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-club-accent"
          />
        </div>
      </div>
    </div>
  );
}
