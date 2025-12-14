"use client"

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { ErrorNotice } from '@open-mercato/ui/primitives/ErrorNotice'
import { apiFetch } from '@open-mercato/ui/backend/utils/api'
import { flash } from '@open-mercato/ui/backend/FlashMessages'
import { useT } from '@/lib/i18n/context'
import { translateWithFallback } from '@open-mercato/shared/lib/i18n/translate'
import { useOrganizationScopeVersion } from '@/lib/frontend/useOrganizationScope'
import {
  customerDictionaryQueryOptions,
} from '@open-mercato/core/modules/customers/components/detail/hooks/useCustomerDictionary'
import { PipelineHeader } from './components/PipelineHeader'
import { PipelineLane } from './components/PipelineLane'
import { PipelineLayout } from './components/PipelineLayout'
import type { DealRecord, DealsQueryData, SortOption, StageDefinition } from './types'
import {
  normalizeAmount,
  normalizeProbability,
  normalizeTimestamp,
  buildStageDefinitions,
  createDealMap,
  groupDealsByStage,
  sortDeals,
  formatCurrency,
  formatProbability,
  filterDealsBySearch,
} from './utils'

const DEALS_QUERY_LIMIT = 100

const dealsQueryKey = (scopeVersion: number) =>
  ['customers', 'deals', 'pipeline', `scope:${scopeVersion}`] as const

export default function SalesPipelinePage(): React.ReactElement {
  const t = useT()
  const translate = React.useCallback(
    (key: string, fallback: string, params?: Record<string, string | number>) => {
      const value = translateWithFallback(t, key, fallback, params)
      if (value === fallback && params) {
        return fallback.replace(/\{\{(\w+)\}\}|\{(\w+)\}/g, (match, doubleToken, singleToken) => {
          const token = (doubleToken ?? singleToken) as string | undefined
          if (!token) return match
          const replacement = params[token]
          if (replacement === undefined) {
            return doubleToken ? `{{${token}}}` : `{${token}}`
          }
          return String(replacement)
        })
      }
      return value
    },
    [t],
  )

  const scopeVersion = useOrganizationScopeVersion()
  const queryClient = useQueryClient()
  const [sortBy, setSortBy] = React.useState<SortOption>('probability')
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const [pendingDealId, setPendingDealId] = React.useState<string | null>(null)
  const dealsKey = React.useMemo(() => dealsQueryKey(scopeVersion), [scopeVersion])

  const { data: dictionaryData } = useQuery(customerDictionaryQueryOptions('pipeline-stages', scopeVersion))

  const dealsQuery = useQuery<DealsQueryData>({
    queryKey: dealsKey,
    staleTime: 30_000,
    queryFn: async () => {
      const search = new URLSearchParams()
      search.set('page', '1')
      search.set('pageSize', String(DEALS_QUERY_LIMIT))
      search.set('sortField', 'createdAt')
      search.set('sortDir', 'desc')
      const res = await apiFetch(`/api/customers/deals?${search.toString()}`)
      const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (!res.ok) {
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : translate('customers.deals.pipeline.loadError', 'Failed to load deals.')
        throw new Error(message)
      }
      const items = Array.isArray(payload?.items) ? payload.items : []
      const deals: DealRecord[] = []
      items.forEach((item) => {
        if (!item || typeof item !== 'object') return
        const data = item as Record<string, unknown>
        const id = typeof data.id === 'string' ? data.id : null
        if (!id) return
        const title =
          typeof data.title === 'string' && data.title.trim().length
            ? data.title.trim()
            : translate('customers.deals.pipeline.untitled', 'Untitled deal')
        const status =
          typeof data.status === 'string' && data.status.trim().length ? data.status.trim() : null
        const stage =
          typeof data.pipeline_stage === 'string' && data.pipeline_stage.trim().length
            ? data.pipeline_stage.trim()
            : null
        const amount = normalizeAmount(data.value_amount)
        const currency =
          typeof data.value_currency === 'string' && data.value_currency.trim().length
            ? data.value_currency.trim().toUpperCase()
            : null
        const probability = normalizeProbability(data.probability)
        const expected = normalizeTimestamp(data.expected_close_at)
        const created = normalizeTimestamp(data.created_at)
        const updated = normalizeTimestamp(data.updated_at)
        const rawPeople = Array.isArray(data.people) ? data.people : []
        const people = rawPeople
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null
            const ref = entry as Record<string, unknown>
            const personId = typeof ref.id === 'string' ? ref.id : null
            if (!personId) return null
            const label =
              typeof ref.label === 'string' && ref.label.trim().length
                ? ref.label.trim()
                : personId
            return { id: personId, label }
          })
          .filter((entry): entry is { id: string; label: string } => !!entry)
        const rawCompanies = Array.isArray(data.companies) ? data.companies : []
        const companies = rawCompanies
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null
            const ref = entry as Record<string, unknown>
            const companyId = typeof ref.id === 'string' ? ref.id : null
            if (!companyId) return null
            const label =
              typeof ref.label === 'string' && ref.label.trim().length
                ? ref.label.trim()
                : companyId
            return { id: companyId, label }
          })
          .filter((entry): entry is { id: string; label: string } => !!entry)
        deals.push({
          id,
          title,
          status,
          pipelineStage: stage,
          valueAmount: amount,
          valueCurrency: currency,
          probability,
          expectedCloseAt: expected.iso,
          expectedCloseAtTs: expected.ts,
          createdAt: created.iso,
          createdAtTs: created.ts,
          updatedAt: updated.iso,
          people,
          companies,
        })
      })

      const total = typeof payload?.total === 'number' ? payload.total : deals.length
      return { deals, total }
    },
  })

  const allDeals = dealsQuery.data?.deals ?? []
  const total = dealsQuery.data?.total ?? allDeals.length

  // Apply search filter
  const filteredDeals = React.useMemo(
    () => filterDealsBySearch(allDeals, searchQuery),
    [allDeals, searchQuery],
  )

  // Memoized computations
  const dealMap = React.useMemo(() => createDealMap(filteredDeals), [filteredDeals])
  const groupedDeals = React.useMemo(() => groupDealsByStage(filteredDeals), [filteredDeals])
  const stages = React.useMemo(
    () => buildStageDefinitions(dictionaryData, filteredDeals, t),
    [dictionaryData, filteredDeals, t],
  )

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
      }),
    [],
  )

  const formatDate = React.useCallback(
    (date: string | null, fallback: string) => {
      if (!date) return fallback
      try {
        return dateFormatter.format(new Date(date))
      } catch {
        return fallback
      }
    },
    [dateFormatter],
  )

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, pipelineStage }: { id: string; pipelineStage: string }) => {
      const res = await apiFetch('/api/customers/deals', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, pipelineStage }),
      })
      const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>
      if (!res.ok) {
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : translate('customers.deals.pipeline.moveError', 'Failed to update deal stage.')
        throw new Error(message)
      }
      return { id, pipelineStage }
    },
    onMutate: async ({ id, pipelineStage }) => {
      setPendingDealId(id)
      await queryClient.cancelQueries({ queryKey: dealsKey })
      const previous = queryClient.getQueryData<DealsQueryData>(dealsKey)
      if (previous) {
        const nextDeals = previous.deals.map((deal) =>
          deal.id === id ? { ...deal, pipelineStage } : deal,
        )
        queryClient.setQueryData<DealsQueryData>(dealsKey, { ...previous, deals: nextDeals })
      }
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData<DealsQueryData>(dealsKey, context.previous)
      }
      const message =
        error instanceof Error && error.message
          ? error.message
          : translate('customers.deals.pipeline.moveError', 'Failed to update deal stage.')
      flash(message, 'error')
    },
    onSuccess: () => {
      flash(translate('customers.deals.pipeline.moveSuccess', 'Deal updated.'), 'success')
    },
    onSettled: () => {
      setPendingDealId(null)
      queryClient.invalidateQueries({ queryKey: dealsKey }).catch(() => {})
    },
  })

  const [draggingId, setDraggingId] = React.useState<string | null>(null)
  const [activeLane, setActiveLane] = React.useState<string | null>(null)

  const handleDragStart = React.useCallback((dealId: string) => {
    setDraggingId(dealId)
  }, [])

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(null)
    setActiveLane(null)
  }, [])

  const handleDrop = React.useCallback(
    (stage: StageDefinition) => async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setActiveLane(null)
      const dealId = event.dataTransfer.getData('text/plain') || draggingId
      if (!dealId) return
      const deal = dealMap.get(dealId)
      if (!deal) return
      if (stage.value === null) {
        flash(
          translate('customers.deals.pipeline.unassignedDisabled', 'Moving to "No stage" is not supported.'),
          'info',
        )
        return
      }
      if (deal.pipelineStage === stage.value) return
      updateStageMutation.mutate({ id: dealId, pipelineStage: stage.value })
    },
    [dealMap, draggingId, translate, updateStageMutation],
  )

  const handleDragOver = React.useCallback(
    (stageId: string) => (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      if (activeLane !== stageId) setActiveLane(stageId)
    },
    [activeLane],
  )

  const handleSortChange = React.useCallback((option: SortOption) => {
    setSortBy(option)
  }, [])

  const handleSearchChange = React.useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const handleClearSearch = React.useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <PipelineLayout>
      <Page>
        <PageBody className="overflow-hidden p-0" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="flex-shrink-0 pb-4 pt-4 px-6 border-b border-border/50 bg-background z-10">
            <PipelineHeader
              sortBy={sortBy}
              searchQuery={searchQuery}
              onSortChange={handleSortChange}
              onSearchChange={handleSearchChange}
              onClearSearch={handleClearSearch}
              translate={translate}
            />
          </div>

          {/* Scrollable Pipeline Area */}
          <div className="flex-1 overflow-hidden">
          {dealsQuery.isLoading ? (
              <div className="flex h-[60vh] items-center justify-center">
              <Spinner />
            </div>
          ) : dealsQuery.isError ? (
              <div className="max-w-xl p-4">
              <ErrorNotice
                message={
                  dealsQuery.error instanceof Error
                    ? dealsQuery.error.message
                    : translate('customers.deals.pipeline.loadError', 'Failed to load deals.')
                }
              />
            </div>
          ) : (
              <div className="flex flex-col h-full">
                {(total > allDeals.length || searchQuery) && (
                  <div className="flex-shrink-0 px-4 py-2 border-b border-border/50 bg-muted/30">
                    {total > allDeals.length && (
                      <div className="text-sm text-muted-foreground">
                  {translate(
                    'customers.deals.pipeline.limitNotice',
                    'Showing the first {count} deals. Refine your filters to see more.',
                          { count: allDeals.length },
                        )}
                      </div>
                    )}
                    {searchQuery && filteredDeals.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        {translate(
                          'customers.deals.pipeline.noSearchResults',
                          'No deals found matching "{query}".',
                          { query: searchQuery },
                        )}
                      </div>
                  )}
                </div>
                )}

                {/* Horizontal Scrollable Pipeline */}
                <div 
                  className="flex-1 overflow-x-auto overflow-y-hidden pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgb(var(--muted)) transparent',
                  }}
                >
                  <div className="flex gap-6 min-w-max px-6 py-6 h-full">
                {stages.length === 0 ? (
                      <div className="flex h-[60vh] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                    <span className="text-sm text-muted-foreground">
                      {translate('customers.deals.pipeline.noStages', 'Define pipeline stages to start tracking deals.')}
                    </span>
                  </div>
                ) : (
                  stages.map((stage) => {
                    const stageKey = stage.value ?? null
                    const laneDeals = groupedDeals.get(stageKey) ?? []
                    const sortedLaneDeals = sortDeals(laneDeals, sortBy)

                    return (
                          <PipelineLane
                        key={stage.id}
                            stage={stage}
                            deals={sortedLaneDeals}
                            isActive={activeLane === stage.id}
                            draggingId={draggingId}
                            pendingDealId={pendingDealId}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragStart={handleDragStart}
                                  onDragEnd={handleDragEnd}
                            translate={translate}
                            formatCurrency={formatCurrency}
                            formatProbability={formatProbability}
                            formatDate={formatDate}
                          />
                              )
                            })
                          )}
                        </div>
                      </div>
              </div>
            )}
            </div>
        </div>
      </PageBody>
    </Page>
    </PipelineLayout>
  )
}
