<script setup lang="ts">
import { ref, watch } from 'vue'
import Closable from './Closable.vue'
import Editor from './Editor.vue'
import NoteListView from './monologue/NoteListView.vue'
import { Note } from '../../common/note'

type Props = {
  note: Note | undefined
}
type Emits = {
  (e: 'close-clicked'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const input = ref<string>()
const notes = ref<Note[]>([])
const editing = ref<Note | null>(null)

async function load() {
  if (props.note == null) return

  notes.value.length = 0

  for (const note of await window.api.getNotes({
    parentId: props.note.id,
    removed: false,
  })) {
    notes.value.push(note)
  }
}

async function createOrUpdate() {
  if (props.note == null) return
  if (!input.value) return

  // create
  if (editing.value == null) {
    const note = await window.api.createNote({
      content: input.value,
      threadId: props.note.threadId,
      parentId: props.note.id,
    })
    notes.value.push(note)
  }
  // update
  else {
    if (input.value !== editing.value.content) {
      const target = editing.value
      const idx = notes.value.findIndex((x) => x.id === target.id)

      if (idx === -1) throw new Error('note does not exist')

      const updated = await window.api.updateNote({
        id: target.id,
        content: input.value,
      })

      notes.value[idx] = updated
    }
    editing.value = null
  }

  input.value = ''
}

async function remove(note: Note) {
  const idx = notes.value.findIndex((x) => x.id === note.id)

  if (idx === -1) throw new Error('note does not exist')

  await window.api.removeNote(note.id)

  notes.value.splice(idx, 1)
}

watch(
  () => props.note,
  async () => {
    await load()
  }
)
</script>

<template>
  <Closable @close-clicked="() => emit('close-clicked')">
    <div class="tree-layout">
      <div v-if="props.note != null">ツリー: {{ props.note.content }}</div>
      <NoteListView
        class="note-list"
        :notes="notes"
        :can-expand-tree="false"
        :preview-note="input"
        @edit-clicked="
          (note) => {
            editing = note
            input = note.content
          }
        "
        @remove-clicked="remove"
      />
      <Editor class="editor" v-model="input" @create-clicked="createOrUpdate" />
    </div>
  </Closable>
</template>

<style scoped>
.tree-layout {
  display: grid;
  grid-template-rows: 1fr auto;
}

.note-list {
  grid-row: 1/2;
}

.editor {
  grid-row: 2/3;
}
</style>
