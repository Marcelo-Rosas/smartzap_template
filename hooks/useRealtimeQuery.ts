'use client'

/**
 * useRealtimeQuery Hook
 * 
 * Integrates Supabase Realtime with React Query for automatic cache updates.
 * Part of the Realtime infrastructure (T005).
 */

import { useEffect, useMemo, useCallback, useRef } from 'react'
import { useQuery, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query'
import { debounce } from '@/lib/utils'
import { createRealtimeChannel, subscribeToTable, activateChannel, removeChannel } from '@/lib/supabase-realtime'
import type { RealtimeTable, RealtimeEventType, RealtimePayload } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

export interface UseRealtimeQueryOptions<TData, TError = Error>
    extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
    /**
     * React Query key
     */
    queryKey: QueryKey

    /**
     * Fetch function
     */
    queryFn: () => Promise<TData>

    /**
     * Table to subscribe to for Realtime updates
     */
    table: RealtimeTable

    /**
     * Event types to listen for (default: '*')
     */
    events?: RealtimeEventType[]

    /**
     * PostgREST filter (e.g., 'id=eq.123')
     */
    filter?: string

    /**
     * Debounce updates in milliseconds (default: 200)
     */
    debounceMs?: number

    /**
     * Custom handler for Realtime updates
     * If not provided, will invalidate the query
     */
    onRealtimeUpdate?: (
        payload: RealtimePayload,
        queryClient: ReturnType<typeof useQueryClient>
    ) => void
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Combines React Query with Supabase Realtime for automatic updates
 * 
 * @example
 * ```tsx
 * const { data: campaigns } = useRealtimeQuery({
 *   queryKey: ['campaigns'],
 *   queryFn: fetchCampaigns,
 *   table: 'campaigns',
 *   events: ['INSERT', 'UPDATE'],
 * })
 * ```
 */
export function useRealtimeQuery<TData = unknown, TError = Error>({
    queryKey,
    queryFn,
    table,
    events = ['*'],
    filter,
    debounceMs = 200,
    onRealtimeUpdate,
    ...queryOptions
}: UseRealtimeQueryOptions<TData, TError>) {
    const queryClient = useQueryClient()
    const channelRef = useRef<ReturnType<typeof createRealtimeChannel> | null>(null)
    const mountedRef = useRef(true)

    // Standard React Query
    const query = useQuery<TData, TError>({
        queryKey,
        queryFn,
        ...queryOptions,
    })

  // Stable keys for deps (avoid spreading arrays/objects in dependency arrays)
  const eventsKey = useMemo(() => events.join(','), [events])
  const queryKeyString = useMemo(
    () => (Array.isArray(queryKey) ? JSON.stringify(queryKey) : String(queryKey)),
    [queryKey]
  )
  const eventsList = useMemo(() => events, [events])

    // Debounced invalidation (created outside of render to avoid ref access during render)
    const debouncedInvalidateRef = useRef<ReturnType<typeof debounce> | null>(null)
    useEffect(() => {
        debouncedInvalidateRef.current?.cancel?.()
        debouncedInvalidateRef.current = debounce(() => {
            if (mountedRef.current) {
                queryClient.invalidateQueries({ queryKey })
            }
        }, debounceMs)
        return () => {
            debouncedInvalidateRef.current?.cancel?.()
        }
    }, [queryClient, queryKey, debounceMs])

    // Handler for Realtime events
    const handleRealtimeEvent = useCallback(
        (payload: RealtimePayload) => {
            if (!mountedRef.current) return

            if (onRealtimeUpdate) {
                // Custom handler
                onRealtimeUpdate(payload, queryClient)
            } else {
                // Default: invalidate query (triggers refetch)
                debouncedInvalidateRef.current?.()
            }
        },
        [onRealtimeUpdate, queryClient]
    )

    // Setup Realtime subscription
    useEffect(() => {
        mountedRef.current = true

        // Create unique channel name
    const channelName = `rq-${table}-${queryKeyString}-${Date.now()}`
        const channel = createRealtimeChannel(channelName)

        // Skip if Supabase not configured
        if (!channel) {
            console.warn('[useRealtimeQuery] Supabase not configured, skipping realtime')
            return
        }

        channelRef.current = channel

        // Subscribe to each event type
    eventsList.forEach((event) => {
            subscribeToTable(channel, table, event, handleRealtimeEvent, filter)
        })

        // Activate subscription
        activateChannel(channel).catch((err) => {
            console.error(`[useRealtimeQuery] Failed to subscribe to ${table}:`, err)
        })

        // Cleanup
        return () => {
            mountedRef.current = false
            debouncedInvalidateRef.current?.cancel?.()

            if (channelRef.current) {
                removeChannel(channelRef.current)
                channelRef.current = null
            }
        }
  }, [table, filter, handleRealtimeEvent, eventsKey, queryKeyString, eventsList])

    return query
}
