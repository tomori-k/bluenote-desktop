import { defineStore } from 'pinia'

export const useThreadStore = defineStore('threads', {
  state() {
    return {
      loaded: false,
      threads: [] as any[],
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
  },
})
