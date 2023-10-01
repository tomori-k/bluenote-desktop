<script setup lang="ts">
import { ref, watch } from 'vue'
import Closable from './Closable.vue'
import Editor from './Editor.vue'
import NoteList from './monologue/NoteList.vue'

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
  note: Note | undefined
}
type Emits = {
  (e: 'close-clicked'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const input = ref<string>()
const notes = ref<Note[]>([])

async function load() {
  if (props.note == null) return

  notes.value.length = 0

  for (const note of await window.api.getTree(props.note.id)) {
    notes.value.push(note)
  }
}

async function create() {
  if (props.note == null) return
  if (!input.value) return

  try {
    const note = await window.api.createNote({
      content: input.value,
      threadId: props.note.threadId,
      parentId: props.note.id,
    })
    notes.value.push(note)
    input.value = ''
  } catch (e) {
    console.error(e)
  }
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
      <NoteList class="note-list" :notes="notes" />
      <Editor class="editor" v-model="input" @create-clicked="create" />
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
