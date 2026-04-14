/**
 * Converts milliseconds to a display string.
 * Examples: 1234 → "1.23"  |  61234 → "1:01.23"
 */
export function formatTime(ms: number): string {
  const totalCentis = Math.floor(ms / 10);
  const centis = totalCentis % 100;
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  const csStr = String(centis).padStart(2, "0");

  if (minutes > 0) {
    return `${minutes}:${String(seconds).padStart(2, "0")}.${csStr}`;
  }
  return `${seconds}.${csStr}`;
}
