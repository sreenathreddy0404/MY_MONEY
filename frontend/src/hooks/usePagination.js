import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "./useStore.jsx"
import { useDebounced } from "./useDebounced.js"

/**
 * Server-side pagination + filtering.
 *  - fetcher(params, signal) -> { data, pagination, summary? }
 *  - Any change to filters (search is debounced) or page size drops back to page 1 automatically,
 *    without an extra request: the page is stored together with the filter "signature" it belongs to.
 *  - Filters are kept while navigating between pages.
 *  - Stale responses are aborted; mutations elsewhere refetch via the store version.
 */
export function usePagination(fetcher, { initialFilters = {}, initialLimit = 10 } = {}) {
  const { version } = useStore()
  const [filters, setFilters] = useState(initialFilters)
  const [limit, setLimitState] = useState(initialLimit)
  const debouncedSearch = useDebounced(filters.search ?? "", 300)

  const effective = useMemo(
    () => ({ ...filters, ...(filters.search !== undefined ? { search: debouncedSearch.trim() } : {}) }),
    [filters, debouncedSearch],
  )
  const sig = JSON.stringify([effective, limit])

  const [pageState, setPageState] = useState({ sig, page: 1 })
  const page = pageState.sig === sig ? pageState.page : 1
  const setPage = useCallback((p) => setPageState({ sig, page: p }), [sig])

  const [state, setState] = useState({ rows: [], pagination: null, summary: null, loading: true, error: null })
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    const ctrl = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetcherRef
      .current({ ...effective, page, limit }, ctrl.signal)
      .then((res) => setState({ rows: res.data, pagination: res.pagination, summary: res.summary ?? null, loading: false, error: null }))
      .catch((e) => {
        if (e?.name === "AbortError") return
        setState((s) => ({ ...s, loading: false, error: e.message || "Failed to load" }))
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, page, version, reloadTick])

  // If the last row of the last page was deleted, step back one page.
  useEffect(() => {
    const p = state.pagination
    if (p && !state.loading && p.total > 0 && page > p.totalPages) setPage(p.totalPages)
  }, [state.pagination, state.loading, page, setPage])

  const setFilter = useCallback((key, value) => setFilters((f) => ({ ...f, [key]: value })), [])
  const resetFilters = useCallback(() => setFilters(initialFilters), []) // eslint-disable-line react-hooks/exhaustive-deps
  const setLimit = useCallback((n) => setLimitState(n), [])
  const refetch = useCallback(() => setReloadTick((n) => n + 1), [])

  return { ...state, page, limit, filters, setFilter, resetFilters, setPage, setLimit, refetch }
}
