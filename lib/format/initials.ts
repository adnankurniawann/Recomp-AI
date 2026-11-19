/** Up to two initials for an avatar without a photo: "Dinda Putri" → "DP", "rani" → "R". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]!;
  const last = words.length > 1 ? words[words.length - 1]! : "";
  return (Array.from(first)[0]! + (last ? Array.from(last)[0]! : "")).toUpperCase();
}
