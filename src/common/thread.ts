export type Thread = {
  id: string
  name: string
  displayMode: 'monologue' | 'scrap'
  createdAt: Date
  removed: boolean
  removedAt: Date
  updatedById: string
  updatedAt: Date
}
