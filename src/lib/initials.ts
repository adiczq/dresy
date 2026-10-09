/** Zwraca inicjały z pierwszego i ostatniego wyrazu imienia i nazwiska. */
export function getPlayerInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";

  const first = words[0].charAt(0);
  const last = words.length > 1 ? words[words.length - 1].charAt(0) : "";
  return (first + last).toLocaleUpperCase("pl-PL");
}
