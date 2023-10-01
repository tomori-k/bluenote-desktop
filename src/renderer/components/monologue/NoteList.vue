<script setup lang="ts">
type Note = {
  id: string
  content: string
  editorId: string
  createdAt: Date
  updatedAt: Date
  threadId: string
  parentId: string | null
  removed: boolean
  removedAt: Date
}
type Props = {
  notes: Note[]
}
type Emits = {
  (e: 'reach-top'): void
  (e: 'note-clicked', note: Note): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
<template>
  <div class="note-list-root">
    <div
      v-for="note in props.notes"
      class="note"
      @click="() => emit('note-clicked', note)"
    >
      {{ note.id }},{{ note.content }},{{ note.editorId }},{{
        note.createdAt
      }},{{ note.updatedAt }}
    </div>
  </div>
</template>

<style scoped>
.note-list-root {
  overflow-y: auto;
}

.note {
  word-break: break-all;
}
</style>
