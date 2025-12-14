export type DealAssociation = { id: string; label: string }

export type DealRecord = {
  id: string
  title: string
  status: string | null
  pipelineStage: string | null
  valueAmount: number | null
  valueCurrency: string | null
  probability: number | null
  expectedCloseAt: string | null
  expectedCloseAtTs: number | null
  createdAt: string | null
  createdAtTs: number | null
  updatedAt: string | null
  people: DealAssociation[]
  companies: DealAssociation[]
}

export type DealsQueryData = {
  deals: DealRecord[]
  total: number
}

export type StageDefinition = {
  id: string
  value: string | null
  label: string
  color: string | null
  icon: string | null
}

export type SortOption = 'probability' | 'createdAt' | 'expectedCloseAt'








