export type Note = {
  id: string
  content: string
  editorId: string
  createdAt: Date
  updatedAt: Date
  threadId: string
  parentId: string | null
  removed: boolean
}
