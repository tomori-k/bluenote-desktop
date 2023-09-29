import { defineStore } from 'pinia'

export const useNoteStore = defineStore('notes', {
  state() {
    return {
      notes: [] as any[],
    }
  },
  actions: {
    async load() {
      for (const note of await window.electronApi.getAllNotes()) {
        this.notes.push(note)
      }
    },
    async create(content: string) {
      const created = await window.electronApi.create({ content: content })
      this.notes.push(created)
    },
  },
})
