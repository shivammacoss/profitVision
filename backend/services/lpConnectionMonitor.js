/**
 * LP Connection Monitor Service
 * 
 * Monitors connection to Corecen LP Platform and ensures it never silently disconnects.
 * - Heartbeat ping every 30 seconds via REST API
 * - Auto-reconnect with infinite retries
 * - Clear logging of connection status
 * - Health check before critical operations
 */

import crypto from 'crypto'

// Connection state
let isLpConnected = false
let lastHeartbeat = null
let lastHeartbeatSuccess = false
let consecutiveFailures = 0
let heartbeatInterval = null

// Configuration
const HEARTBEAT_INTERVAL_MS = 30 * 1000 // 30 seconds
const HEARTBEAT_TIMEOUT_MS = 10 * 1000 // 10 second timeout
const MAX_CONSECUTIVE_FAILURES_BEFORE_ALERT = 3

// Get LP config
const getLpConfig = () => ({
  apiUrl: process.env.LP_API_URL || 'https://api.corecen.com',
  apiKey: process.env.LP_API_KEY || '',
  apiSecret: process.env.LP_API_SECRET || '',
})

/**
 * Ping Corecen health endpoint
 */
export const pingCorecen = async () => {
  const config = getLpConfig()
  
  if (!config.apiKey || !config.apiSecret) {
    console.warn('[LP Monitor] LP credentials not configured')
    return { success: false, error: 'LP credentials not configured' }
  }

  const timestamp = Date.now().toString()
  const path = '/api/v1/broker-api/health'
  
  try {
    const message = timestamp + 'GET' + path
    const signature = crypto.createHmac('sha256', config.apiSecret).update(message).digest('hex')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT_MS)

    const response = await fetch(`${config.apiUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      return { success: true, latencyMs: Date.now() - parseInt(timestamp) }
    } else {
      const data = await response.json().catch(() => ({}))
      return { success: false, error: data.error?.message || `HTTP ${response.status}` }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout - LP not responding' }
    }
    return { success: false, error: error.message }
  }
}

/**
 * Heartbeat check - runs every 30 seconds
 */
const runHeartbeat = async () => {
  const result = await pingCorecen()
  lastHeartbeat = new Date()
  lastHeartbeatSuccess = result.success

  if (result.success) {
    if (!isLpConnected || consecutiveFailures > 0) {
      console.log(`[LP Monitor] ✓ Corecen LP connected (latency: ${result.latencyMs}ms)`)
    }
    isLpConnected = true
    consecutiveFailures = 0
  } else {
    consecutiveFailures++
    isLpConnected = false
    
    console.error(`[LP Monitor] ✗ Corecen LP DISCONNECTED - ${result.error} (failure #${consecutiveFailures})`)
    
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES_BEFORE_ALERT) {
      console.error(`[LP Monitor] ⚠️ CRITICAL: LP has been down for ${consecutiveFailures} consecutive checks!`)
      console.error(`[LP Monitor] ⚠️ A-Book trades will NOT sync to Corecen until connection is restored!`)
    }
  }

  return result
}

/**
 * Start the connection monitor
 */
export const startMonitor = () => {
  if (heartbeatInterval) {
    console.log('[LP Monitor] Already running')
    return
  }

  console.log('[LP Monitor] Starting LP connection monitor...')
  console.log(`[LP Monitor] Heartbeat interval: ${HEARTBEAT_INTERVAL_MS / 1000}s`)
  console.log(`[LP Monitor] LP URL: ${getLpConfig().apiUrl}`)

  // Run initial heartbeat
  runHeartbeat()

  // Schedule recurring heartbeats
  heartbeatInterval = setInterval(runHeartbeat, HEARTBEAT_INTERVAL_MS)

  console.log('[LP Monitor] ✓ Monitor started')
}

/**
 * Stop the connection monitor
 */
export const stopMonitor = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
  }
  console.log('[LP Monitor] Monitor stopped')
}

/**
 * Get current connection status
 */
export const getStatus = () => ({
  connected: isLpConnected,
  lastHeartbeat: lastHeartbeat?.toISOString() || null,
  lastHeartbeatSuccess,
  consecutiveFailures,
  lpUrl: getLpConfig().apiUrl,
  configured: !!(getLpConfig().apiKey && getLpConfig().apiSecret),
})

/**
 * Check if LP is healthy before a critical operation
 */
export const ensureLpHealthy = async () => {
  if (isLpConnected && lastHeartbeat && (Date.now() - lastHeartbeat.getTime() < 60000)) {
    return true
  }

  const result = await pingCorecen()
  isLpConnected = result.success
  lastHeartbeat = new Date()
  lastHeartbeatSuccess = result.success

  if (!result.success) {
    console.error(`[LP Monitor] Pre-trade health check FAILED: ${result.error}`)
  }

  return result.success
}

/**
 * Force an immediate health check
 */
export const forceHealthCheck = async () => {
  console.log('[LP Monitor] Running forced health check...')
  const result = await runHeartbeat()
  return {
    ...getStatus(),
    lastCheckResult: result,
  }
}

export default {
  startMonitor,
  stopMonitor,
  getStatus,
  pingCorecen,
  ensureLpHealthy,
  forceHealthCheck,
}
