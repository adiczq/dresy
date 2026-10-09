import { Ruler } from "lucide-react";

const SIZES = ["6XS", "5XS", "4XS", "3XS", "2XS", "XS"];

type SizePickerProps = {
  id: string;
  label: string;
  value: string;
  suggestion: string | null;
  onChange: (value: string) => void;
};

export default function SizePicker({
  id,
  label,
  value,
  suggestion,
  onChange,
}: SizePickerProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        {label}
      </label>
      <select
        id={id}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/15 bg-club-bg px-4 py-4 text-sm font-semibold text-white outline-none focus:border-club-accent"
      >
        <option value="">Wybierz rozmiar</option>
        {SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
        <option value="Do ustalenia">Do ustalenia</option>
      </select>
      {suggestion && (
        <p className="mt-2 flex items-center gap-2 text-xs text-club-accent">
          <Ruler size={14} />
          Sugestia kalkulatora: {suggestion}
        </p>
      )}
    </div>
  );
}
