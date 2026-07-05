export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export const truncate = (text: string, length: number): string => {
  return text.length > length ? `${text.substring(0, length)}...` : text
}

export const statusToLabel = (status: string): string => {
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const reviewDurationLabel = (
  daysInReview?: number | null,
  reviewStartedAt?: string | null,
  isCurrentlyInReview?: boolean,
  fallbackDate?: string | null
): string => {
  const startDate = reviewStartedAt ?? fallbackDate

  if (isCurrentlyInReview && startDate) {
    const elapsedDays = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
    return `${elapsedDays}d`
  }
  if (daysInReview !== undefined && daysInReview !== null) {
    return `${daysInReview}d`
  }
  if (fallbackDate) {
    const elapsedDays = Math.floor((Date.now() - new Date(fallbackDate).getTime()) / 86400000)
    return `${elapsedDays}d`
  }
  return '—'
}

export const soldDurationLabel = (createdAt?: string | null, soldAt?: string | null): string => {
  if (!createdAt) return '—'
  const startMs = new Date(createdAt).getTime()
  if (Number.isNaN(startMs)) return '—'
  const end = soldAt ? new Date(soldAt).getTime() : Date.now()
  const days = Math.floor((end - startMs) / 86400000)
  return `${days}d`
}

export const statusToColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    approved: 'bg-green-100 text-green-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    production: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    faulty: 'bg-orange-100 text-orange-800',
    sold: 'bg-purple-100 text-purple-800',
    used: 'bg-blue-100 text-blue-800',
    unused: 'bg-gray-100 text-gray-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    removed: 'bg-red-100 text-red-800',
    suspended_app: 'bg-red-100 text-red-800',
    development: 'bg-blue-100 text-blue-800',
    idea: 'bg-gray-100 text-gray-800',
    implemented: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800',
  }
  return colorMap[status] || 'bg-gray-100 text-gray-800'
}
