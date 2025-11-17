/**
 * Convert date to relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'Baru saja';
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} menit yang lalu`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} jam yang lalu`;
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} hari yang lalu`;
  }

  // Less than a month
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} minggu yang lalu`;
  }

  // Less than a year
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} bulan yang lalu`;
  }

  // More than a year
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} tahun yang lalu`;
}

/**
 * Format date with relative time tooltip
 */
export function formatDateWithRelative(date: Date | string): {
  relative: string;
  absolute: string;
} {
  const absolute = new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const relative = getRelativeTime(date);

  return { relative, absolute };
}

/**
 * Format date for display (short version)
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
