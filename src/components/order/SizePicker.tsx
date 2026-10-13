import { Ruler } from "lucide-react";
import { ORDER_SIZES } from "@/lib/sizes";

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
        className="bg-club-bg focus:border-club-accent w-full rounded-xl border border-white/15 px-4 py-4 text-sm font-semibold text-white outline-none"
      >
        <option value="">Wybierz rozmiar</option>
        {ORDER_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      {suggestion && (
        <p className="text-club-accent mt-2 flex items-center gap-2 text-xs">
          <Ruler size={14} />
          Sugestia kalkulatora: {suggestion}
        </p>
      )}
    </div>
  );
}
