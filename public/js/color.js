// 1 = in tune (green), 0 = far off (red).
export function proximity(cents, { toleranceCents, farCents }) {
  const c = Math.abs(cents);
  if (c <= toleranceCents) return 1;
  if (c >= farCents) return 0;
  return 1 - (c - toleranceCents) / (farCents - toleranceCents);
}

export const proximityHue = (cents, opts) => 120 * proximity(cents, opts);
