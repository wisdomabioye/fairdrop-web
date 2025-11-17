/**
 * Format time duration to human readable string
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted string like "2d 5h" or "30m 15s"
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return '0s';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format time duration to compact format (single unit)
 * @param milliseconds - Duration in milliseconds
 * @returns Compact string like "2d" or "30m" or "15s"
 */
export function formatTimeCompact(milliseconds: number): string {
  if (milliseconds <= 0) return '0s';

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/**
 * Format timestamp to time remaining from now
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted time remaining string
 */
export function timeUntil(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  return formatTimeRemaining(Math.max(0, diff));
}

/**
 * Format timestamp to compact time remaining from now
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Compact formatted time remaining string
 */
export function timeUntilCompact(timestamp: number): string {
  const now = Date.now();
  const diff = timestamp - now;
  return formatTimeCompact(Math.max(0, diff));
}
