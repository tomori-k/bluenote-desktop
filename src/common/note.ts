export type Note = {
  id: string
  content: string
  threadId: string
  parentId: string | null
  trash: boolean
  deleted: boolean
  createdAt: Date
  updatedAt: Date
  modifiedAt: Date
}
