<script setup lang="ts">
import NoteListView from './monologue/NoteListView.vue'
import Editor from './Editor.vue'
import { ref, watch } from 'vue'
import { Thread } from '../../common/thread'
import { Note } from '../../common/note'

type Props = {
  thread: Thread | undefined
}
type Emits = {
  (e: 'tree-clicked', note: Note): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const input = ref<string>()
const editing = ref<Note | null>(null)
const notes = ref<Note[]>([])
// const isSyncing = ref(false)
// const noteStore = useNoteStore()

async function load() {
  if (props.thread == null) return

  notes.value.length = 0

  for (const note of await window.api.getNotes({
    threadId: props.thread.id,
    parentId: null,
    removed: false,
  })) {
    notes.value.push(note)
  }
}

async function createOrUpdate() {
  if (props.thread == null) return
  if (!input.value) return

  // create
  if (editing.value == null) {
    const note = await window.api.createNote({
      threadId: props.thread.id,
      content: input.value,
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
  () => props.thread,
  async () => {
    await load()
  }
)

// async function sync() {
//   isSyncing.value = true
//   try {
//     await noteStore.sync()
//   } finally {
//     isSyncing.value = false
//   }
// }

// noteStore.load()
</script>

<template>
  <div class="thread-layout">
    <!-- <button type="button" @click="sync">同期</button> -->
    <!-- <div v-if="isSyncing">同期中</div> -->
    <div v-if="props.thread != null">スレッド: {{ props.thread.name }}</div>
    <NoteListView
      class="note-list"
      :notes="notes"
      :can-expand-tree="true"
      :preview-note="input"
      @tree-clicked="(note) => emit('tree-clicked', note)"
      @edit-clicked="
        (note) => {
          editing = note
          input = note.content
        }
      "
      @remove-clicked="remove"
    />
    <Editor class="editor" @create-clicked="createOrUpdate" v-model="input" />
  </div>
</template>

<style scoped>
.thread-layout {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

.note-list {
  grid-row: 1/2;
}

.editor {
  grid-row: 2/3;
}
</style>
