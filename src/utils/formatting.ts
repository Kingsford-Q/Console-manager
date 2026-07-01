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

export const statusToColor = (status: string): string => {
  const colorMap: { [key: string]: string } = {
    approved: 'bg-green-100 text-green-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    pending_verification: 'bg-blue-100 text-blue-800',
    suspended: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
    used: 'bg-blue-100 text-blue-800',
    unused: 'bg-gray-100 text-gray-800',
    production: 'bg-green-100 text-green-800',
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
