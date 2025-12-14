"use client"

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@open-mercato/ui/primitives/button'
import { Spinner } from '@open-mercato/ui/primitives/spinner'
import { cn } from '@open-mercato/shared/lib/utils'
import { ExternalLink, Calendar, DollarSign, TrendingUp } from 'lucide-react'

type DealAssociation = { id: string; label: string }

export type DealCardProps = {
  id: string
  title: string
  status: string | null
  valueAmount: number | null
  valueCurrency: string | null
  probability: number | null
  expectedCloseAt: string | null
  people: DealAssociation[]
  companies: DealAssociation[]
  isDragging?: boolean
  isPending?: boolean
  onDragStart: (dealId: string) => void
  onDragEnd: () => void
  translate: (key: string, fallback: string, params?: Record<string, string | number>) => string
  formatCurrency: (amount: number | null, currency: string | null, fallback: string) => string
  formatProbability: (probability: number | null, fallback: string) => string
  formatDate: (date: string | null, fallback: string) => string
}

const getStatusColor = (status: string | null): string => {
  if (!status) return 'bg-muted text-muted-foreground'
  const lower = status.toLowerCase()
  if (lower.includes('loose') || lower.includes('open')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
  if (lower.includes('progress') || lower.includes('negotiation')) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
  if (lower.includes('qualified')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
}

export const DealCard = React.memo(function DealCard({
  id,
  title,
  status,
  valueAmount,
  valueCurrency,
  probability,
  expectedCloseAt,
  people,
  companies,
  isDragging = false,
  isPending = false,
  onDragStart,
  onDragEnd,
  translate,
  formatCurrency,
  formatProbability,
  formatDate,
}: DealCardProps) {
  const handleDragStart = React.useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', id)
      onDragStart(id)
    },
    [id, onDragStart],
  )

  const handleActionClick = React.useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
  }, [])

  const valueLabel = formatCurrency(
    valueAmount,
    valueCurrency,
    translate('customers.deals.list.noValue', 'No value assigned'),
  )
  const probabilityLabel = formatProbability(
    probability,
    translate('customers.deals.pipeline.noProbability', 'N/A'),
  )
  const expectedLabel = formatDate(
    expectedCloseAt,
    translate('customers.deals.pipeline.noExpectedClose', 'No date'),
  )

  const probabilityValue = typeof probability === 'number' ? probability : 0

  return (
    <div
      className={cn(
        'group flex cursor-grab active:cursor-grabbing flex-col gap-4 rounded-lg border border-border bg-background p-5 shadow-sm',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:border-ring/50 hover:-translate-y-1 hover:scale-[1.02]',
        'focus-within:ring-2 focus-within:ring-ring/40',
        isDragging && 'opacity-50 scale-90 rotate-3 shadow-2xl z-50 cursor-grabbing',
        isPending && 'opacity-70',
        !isDragging && !isPending && 'hover:bg-muted/20',
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      style={{
        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: isDragging ? 'rotate(3deg) scale(0.9)' : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">
            {title}
          </h3>
          {status && (
            <span className={cn(
              'inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full',
              getStatusColor(status)
            )}>
              {status}
            </span>
          )}
        </div>
        {isPending && <Spinner className="size-4 shrink-0 mt-1" />}
      </div>

      {/* Metrics - Cleaner Layout */}
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="size-3.5" />
            {translate('customers.deals.pipeline.card.value', 'Value')}
          </span>
          <span className="font-bold text-foreground">{valueLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="size-3.5" />
            {translate('customers.deals.pipeline.card.probability', 'Probability')}
          </span>
          <div className="flex items-center gap-2.5">
            <div className="w-20 h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                style={{ width: `${Math.max(probabilityValue, 5)}%` }}
              />
            </div>
            <span className="font-bold text-foreground min-w-[2.5rem] text-right">{probabilityLabel}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {translate('customers.deals.pipeline.card.expectedClose', 'Expected close')}
          </span>
          <span className="font-semibold text-foreground">{expectedLabel}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          draggable={false}
          onClick={handleActionClick}
        >
          <Link href={`/backend/customers/deals/${id}`} className="flex items-center gap-1.5">
            {translate('customers.deals.pipeline.actions.openDeal', 'Open deal')}
            <ExternalLink className="size-3" />
          </Link>
        </Button>
      </div>

      {/* Associations */}
      {(people.length > 0 || companies.length > 0) && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
          {people.map((person) => (
            <Link
              key={person.id}
              href={`/backend/customers/people/${person.id}`}
              className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
              draggable={false}
              onClick={handleActionClick}
            >
              {person.label}
            </Link>
          ))}
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/backend/customers/companies/${company.id}`}
              className="inline-flex items-center rounded-full bg-secondary/20 px-2.5 py-1 text-[10px] font-medium text-secondary-foreground transition-colors hover:bg-secondary/30"
              draggable={false}
              onClick={handleActionClick}
            >
              {company.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
})
