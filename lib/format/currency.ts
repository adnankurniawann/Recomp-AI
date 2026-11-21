/** Rupiah without decimals, the Indonesian way: 75000 → "Rp75.000". */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  const digits = Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${rounded < 0 ? "-" : ""}Rp${digits}`;
}
