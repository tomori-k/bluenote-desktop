import { Note } from '@prisma/client'

export type NoteWithThreadName = Note & { threadName: string }
export type NoteWithChildrenCount = Note & { childrenCount: number }
