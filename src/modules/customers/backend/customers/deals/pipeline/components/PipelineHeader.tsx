"use client"

import * as React from 'react'
import { Button } from '@open-mercato/ui/primitives/button'
import { Input } from '@open-mercato/ui/primitives/input'
import { Label } from '@open-mercato/ui/primitives/label'
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@open-mercato/shared/lib/utils'

type SortOption = 'probability' | 'createdAt' | 'expectedCloseAt'

type PipelineHeaderProps = {
  sortBy: SortOption
  searchQuery: string
  onSortChange: (option: SortOption) => void
  onSearchChange: (query: string) => void
  onClearSearch: () => void
  translate: (key: string, fallback: string, params?: Record<string, string | number>) => string
}

export const PipelineHeader = React.memo(function PipelineHeader({
  sortBy,
  searchQuery,
  onSortChange,
  onSearchChange,
  onClearSearch,
  translate,
}: PipelineHeaderProps) {
  const handleSortChange = React.useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value as SortOption
      onSortChange(value)
    },
    [onSortChange],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Title Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-foreground">
            {translate('customers.deals.pipeline.title', 'Sales Pipeline')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {translate(
              'customers.deals.pipeline.subtitle',
              'Track deals by pipeline stage and drag them between lanes to update progress.',
            )}
          </p>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-2">
          <Label htmlFor="sort-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            {translate('customers.deals.pipeline.sort.label', 'Sort by')}
          </Label>
          <select
            id="sort-select"
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="probability">
              {translate('customers.deals.pipeline.sort.probability', 'Probability (high to low)')}
            </option>
            <option value="createdAt">
              {translate('customers.deals.pipeline.sort.createdAt', 'Created (newest first)')}
            </option>
            <option value="expectedCloseAt">
              {translate('customers.deals.pipeline.sort.expectedCloseAt', 'Expected close (soonest first)')}
            </option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={translate('customers.deals.pipeline.search.placeholder', 'Search deals by title, company, or person...')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={onClearSearch}
            aria-label={translate('customers.deals.pipeline.search.clear', 'Clear search')}
          >
            <X className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
})








