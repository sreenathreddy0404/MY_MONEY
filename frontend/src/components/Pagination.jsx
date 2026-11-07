import { ChevronLeft, ChevronRight } from "lucide-react"

const LIMITS = [10, 20, 50]

// Page numbers with ellipses: 1 … 4 5 [6] 7 8 … 20
function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const set = new Set([1, totalPages, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n))
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((n) => set.add(n))
  const sorted = [...set].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)
  const out = []
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push("gap")
    out.push(n)
  })
  return out
}

export default function Pagination({ pagination, onPage, limit, onLimit, loading }) {
  if (!pagination || pagination.total === 0) return null
  const { page, total, totalPages, hasNext, hasPrevious } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing {start}–{end} of {total}
        </p>
        <select
          className="input w-auto py-1 text-xs"
          value={limit}
          onChange={(e) => onLimit(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {LIMITS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          className="btn-outline px-2 py-1.5"
          disabled={!hasPrevious || loading}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {pageList(page, totalPages).map((n, i) =>
            n === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                disabled={loading}
                aria-current={n === page ? "page" : undefined}
                className={`h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors ${
                  n === page
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {n}
              </button>
            ),
          )}
        </div>
        <span className="px-2 text-xs text-slate-500 dark:text-slate-400 sm:hidden">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="btn-outline px-2 py-1.5"
          disabled={!hasNext || loading}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}
