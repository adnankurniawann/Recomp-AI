/** Course and lesson length in short Indonesian: 45 → "45 menit", 80 → "1 jam 20 menit", 120 → "2 jam". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} menit`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`;
}
