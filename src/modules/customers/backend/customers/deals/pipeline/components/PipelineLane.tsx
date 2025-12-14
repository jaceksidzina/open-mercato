"use client"

import * as React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'
import { renderDictionaryColor, renderDictionaryIcon } from '@open-mercato/core/modules/customers/lib/dictionaries'
import { DealCard } from './DealCard'
import type { DealRecord } from '../types'
import { formatCurrency } from '../utils'

type StageDefinition = {
  id: string
  value: string | null
  label: string
  color: string | null
  icon: string | null
}

type PipelineLaneProps = {
  stage: StageDefinition
  deals: DealRecord[]
  isActive: boolean
  draggingId: string | null
  pendingDealId: string | null
  onDragOver: (stageId: string) => (event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (stage: StageDefinition) => (event: React.DragEvent<HTMLDivElement>) => void
  onDragStart: (dealId: string) => void
  onDragEnd: () => void
  translate: (key: string, fallback: string, params?: Record<string, string | number>) => string
  formatCurrency: (amount: number | null, currency: string | null, fallback: string) => string
  formatProbability: (probability: number | null, fallback: string) => string
  formatDate: (date: string | null, fallback: string) => string
}

export const PipelineLane = React.memo(function PipelineLane({
  stage,
  deals,
  isActive,
  draggingId,
  pendingDealId,
  onDragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  translate,
  formatCurrency,
  formatProbability,
  formatDate,
}: PipelineLaneProps) {
  // Calculate total value for this stage
  const totalValue = React.useMemo(() => {
    return deals.reduce((sum, deal) => {
      const amount = deal.valueAmount ?? 0
      return sum + amount
    }, 0)
  }, [deals])

  // Get currency from first deal, or default to USD
  const currency = React.useMemo(() => {
    return deals.find(d => d.valueCurrency)?.valueCurrency ?? 'USD'
  }, [deals])

  const renderLaneHeader = React.useCallback(() => {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {stage.icon && (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/50 bg-background">
              {renderDictionaryIcon(stage.icon, 'h-4 w-4 text-muted-foreground')}
            </span>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-bold text-foreground truncate">{stage.label}</span>
            <span className="text-xs text-muted-foreground font-medium">
              {translate('customers.deals.pipeline.countLabel', 'Deals: {count}', { count: deals.length })}
            </span>
          </div>
        </div>
        {stage.color && (
          <div className="shrink-0">
            {renderDictionaryColor(stage.color, 'h-3.5 w-3.5 rounded-full')}
          </div>
        )}
      </div>
    )
  }, [stage, deals.length, translate])

  const renderLaneFooter = React.useCallback(() => {
    const totalValueFormatted = formatCurrency(totalValue, currency, '0.00 USD')
    return (
      <div className="border-t border-border/50 bg-muted/10 px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {translate('customers.deals.pipeline.totalValue', 'Total Value')}
          </span>
          <span className="text-sm font-bold text-foreground">{totalValueFormatted}</span>
        </div>
      </div>
    )
  }, [totalValue, currency, formatCurrency, translate])

  return (
    <div
      className={cn(
        'flex min-h-[70vh] w-full flex-col overflow-hidden rounded-lg border border-border bg-muted/30 shadow-sm',
        'w-[320px] flex-none',
        'transition-all duration-300 ease-out',
        isActive && 'ring-2 ring-primary/60 border-primary/70 shadow-xl bg-muted/50 scale-[1.03]',
        !isActive && 'hover:bg-muted/35',
      )}
      onDragOver={onDragOver(stage.id)}
      onDrop={onDrop(stage)}
      onDragEnter={(e) => {
        e.preventDefault()
        onDragOver(stage.id)(e)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          // Only reset if actually leaving the lane
        }
      }}
      style={{
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {renderLaneHeader()}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-5 py-5">
        {deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border/50 bg-muted/10 p-8 text-center">
            <div className="text-xs text-muted-foreground font-medium">
              {translate('customers.deals.pipeline.emptyLane', 'No deals in this stage yet.')}
            </div>
          </div>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              {...deal}
              isDragging={draggingId === deal.id}
              isPending={pendingDealId === deal.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              translate={translate}
              formatCurrency={formatCurrency}
              formatProbability={formatProbability}
              formatDate={formatDate}
            />
          ))
        )}
      </div>
      {renderLaneFooter()}
    </div>
  )
})
