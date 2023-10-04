import { defineStore } from 'pinia'
import { Thread } from '../../common/thread'
import { Note } from '../../common/note'

export const useThreadStore = defineStore('threads', {
  state() {
    return {
      loaded: false,
      threads: new Array<Thread>(),
    }
  },
  actions: {
    async load() {
      if (this.loaded) return
      for (const thread of await window.api.getAllThreads()) {
        this.threads.push(thread)
      }
      this.loaded = true
    },
    async create(name: string, displayMode: 'monologue' | 'scrap') {
      const created = await window.api.createThread({
        name: name,
        displayMode: displayMode,
      })
      this.threads.push(created)
    },
    async rename(threadId: string, name: string) {
      const idx = this.threads.findIndex((x) => x.id === threadId)
      if (idx === -1) throw new Error('thread does not exist')

      const updated = await window.api.updateThread({
        id: threadId,
        name: name,
      })
      this.threads[idx] = updated
    },
    async remove(threadId: string) {
      const idx = this.threads.findIndex((x) => x.id === threadId)
      if (idx === -1) throw new Error('thread does not exist')

      await window.api.removeThread(threadId)

      this.threads.splice(idx, 1)
    },
    threadOf(note: Note): Thread {
      const thread = this.threads.find((x) => x.id === note.threadId)
      if (thread == null) throw new Error('No thread found')
      return thread
    },
    onRestored(thread: Thread) {
      if (this.threads.find((x) => x.id === thread.id) == null) {
        this.threads.push(thread)
      }
    },
  },
})
