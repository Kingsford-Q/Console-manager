import { useEffect, useState } from 'react'

export const useNow = (intervalMs = 60 * 60 * 1000) => {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
