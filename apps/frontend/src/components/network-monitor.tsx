'use client'

import { useEffect } from 'react'
import { setupNetworkMonitoring } from '@/lib/error-handler'

/**
 * Network Monitor Component
 * Monitors network connectivity and shows notifications
 */
export function NetworkMonitor() {
  useEffect(() => {
    const cleanup = setupNetworkMonitoring()
    return cleanup
  }, [])

  return null
}
