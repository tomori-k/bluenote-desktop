import { Note } from '@prisma/client'

export type NoteType = Note & { childrenCount?: number }

export function ChildrenCountView({ children }: { children: React.ReactNode }) {
  return <p className="bg-midnight-500 h-5 rounded text-center">{children}</p>
}
