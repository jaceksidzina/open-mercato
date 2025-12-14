import type { DealRecord, StageDefinition, SortOption } from './types'
import type { CustomerDictionaryQueryData } from '@open-mercato/core/modules/customers/components/detail/hooks/useCustomerDictionary'
import { translateWithFallback } from '@open-mercato/shared/lib/i18n/translate'
import type { useT } from '@/lib/i18n/context'

export function normalizeAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed.length) return null
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeProbability(value: unknown): number | null {
  const parsed = normalizeAmount(value)
  if (parsed === null) return null
  if (parsed < 0) return 0
  if (parsed > 100) return 100
  return Math.round(parsed)
}

export function normalizeTimestamp(value: unknown): { iso: string | null; ts: number | null } {
  if (typeof value !== 'string' || !value.trim().length) return { iso: null, ts: null }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { iso: null, ts: null }
  return { iso: date.toISOString(), ts: date.getTime() }
}

export function buildStageDefinitions(
  dictionary: CustomerDictionaryQueryData | undefined,
  deals: DealRecord[],
  t: ReturnType<typeof useT>,
): StageDefinition[] {
  const result: StageDefinition[] = []
  const seen = new Set<string>()
  const dictionaryEntries =
    dictionary?.fullEntries ?? dictionary?.entries?.map((entry) => ({ ...entry, id: entry.value })) ?? []

  dictionaryEntries.forEach((entry, index) => {
    if (!entry || typeof entry.value !== 'string') return
    const label = typeof entry.label === 'string' && entry.label.trim().length ? entry.label.trim() : entry.value
    result.push({
      id: `stage:${entry.value}:${index}`,
      value: entry.value,
      label,
      color: typeof entry.color === 'string' ? entry.color : null,
      icon: typeof entry.icon === 'string' ? entry.icon : null,
    })
    seen.add(entry.value)
  })

  const unknownStages = new Map<string, StageDefinition>()
  deals.forEach((deal) => {
    if (!deal.pipelineStage || seen.has(deal.pipelineStage)) return
    if (unknownStages.has(deal.pipelineStage)) return
    unknownStages.set(deal.pipelineStage, {
      id: `stage:${deal.pipelineStage}`,
      value: deal.pipelineStage,
      label: deal.pipelineStage,
      color: null,
      icon: null,
    })
  })

  unknownStages.forEach((entry) => result.push(entry))

  const hasUnassigned = deals.some((deal) => !deal.pipelineStage)
  if (hasUnassigned) {
    result.push({
      id: 'stage:__unassigned',
      value: null,
      label: translateWithFallback(t, 'customers.deals.pipeline.unassigned', 'No stage'),
      color: null,
      icon: null,
    })
  }

  return result
}

export function createDealMap(deals: DealRecord[]): Map<string, DealRecord> {
  return deals.reduce<Map<string, DealRecord>>((acc, deal) => acc.set(deal.id, deal), new Map())
}

export function groupDealsByStage(deals: DealRecord[]): Map<string | null, DealRecord[]> {
  const byStage = new Map<string | null, DealRecord[]>()
  deals.forEach((deal) => {
    const stageKey = deal.pipelineStage ?? null
    const bucket = byStage.get(stageKey) ?? []
    bucket.push(deal)
    byStage.set(stageKey, bucket)
  })
  return byStage
}

export function sortDeals(deals: DealRecord[], option: SortOption): DealRecord[] {
  const sorted = [...deals]
  sorted.sort((a, b) => {
    if (option === 'probability') {
      const ap = typeof a.probability === 'number' ? a.probability : -1
      const bp = typeof b.probability === 'number' ? b.probability : -1
      if (ap !== bp) return bp - ap
    }
    if (option === 'expectedCloseAt') {
      const at = typeof a.expectedCloseAtTs === 'number' ? a.expectedCloseAtTs : Number.POSITIVE_INFINITY
      const bt = typeof b.expectedCloseAtTs === 'number' ? b.expectedCloseAtTs : Number.POSITIVE_INFINITY
      if (at !== bt) return at - bt
    }
    const at = typeof a.createdAtTs === 'number' ? a.createdAtTs : Number.NEGATIVE_INFINITY
    const bt = typeof b.createdAtTs === 'number' ? b.createdAtTs : Number.NEGATIVE_INFINITY
    if (option === 'createdAt') {
      if (at !== bt) return bt - at
    } else if (option === 'expectedCloseAt' || option === 'probability') {
      if (at !== bt) return bt - at
    }
    return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  })
  return sorted
}

export function formatCurrency(amount: number | null, currency: string | null, fallback: string): string {
  if (amount === null || Number.isNaN(amount)) return fallback
  const code = currency && currency.length === 3 ? currency.toUpperCase() : 'USD'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${code} ${amount.toFixed(2)}`
  }
}

export function formatProbability(probability: number | null, fallback: string): string {
  if (typeof probability !== 'number' || Number.isNaN(probability)) return fallback
  return `${probability}%`
}

export function filterDealsBySearch(deals: DealRecord[], searchQuery: string): DealRecord[] {
  if (!searchQuery.trim()) return deals
  const query = searchQuery.toLowerCase().trim()
  return deals.filter((deal) => {
    const titleMatch = deal.title.toLowerCase().includes(query)
    const peopleMatch = deal.people.some((person) => person.label.toLowerCase().includes(query))
    const companiesMatch = deal.companies.some((company) => company.label.toLowerCase().includes(query))
    return titleMatch || peopleMatch || companiesMatch
  })
}

