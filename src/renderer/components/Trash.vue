<script setup lang="ts">
import { ref, watch } from 'vue'
import { Note } from '../../common/note'
import Closable from './Closable.vue'
import TrashNote from './trash/TrashNote.vue'
import { useThreadStore } from '../stores/thread'

type Props = {
  opened: boolean
}
type Emits = {
  (e: 'close-clicked'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const threadStore = useThreadStore()
const notes = ref<Note[]>([])

async function load() {
  notes.value = await window.api.getNotes({ removed: true })
}

async function restore(note: Note) {
  const restoreResult = await window.api.restoreNote({
    id: note.id,
    threadId: note.threadId,
    parentId: note.parentId,
  })
  const restoredIds = restoreResult.notes.map((x) => x.id)
  notes.value = notes.value.filter((x) => !restoredIds.includes(x.id))

  // ここから threadStore にアクセスするのなんか微妙
  threadStore.onRestored(restoreResult.thread)
}

async function deleteNote(note: Note) {
  const deleted = await window.api.deleteNote(note.id)
  const deletedIds = deleted.map((x) => x.id)
  notes.value = notes.value.filter((x) => !deletedIds.includes(x.id))
}

watch(
  () => props.opened,
  async (opened, _) => {
    if (opened) {
      await load()
    }
  }
)
</script>

<template>
  <Closable @close-clicked="() => emit('close-clicked')">
    <div>
      <TrashNote
        v-for="note in notes"
        :note="note"
        @restore-clicked="async () => await restore(note)"
        @delete-clicked="async () => await deleteNote(note)"
      />
    </div>
  </Closable>
</template>
