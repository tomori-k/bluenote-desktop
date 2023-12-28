import { Note } from '@prisma/client'

export type NoteWithThreadName = Note & { threadName: string }
