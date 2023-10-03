<script setup lang="ts">
import NoteList from './monologue/NoteList.vue'
import Editor from './Editor.vue'
// import { useNoteStore } from '../stores/note'
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

async function create() {
  if (props.thread == null) return
  if (!input.value) return

  try {
    const note = await window.api.createNote({
      threadId: props.thread.id,
      content: input.value,
    })
    notes.value.push(note)
    input.value = ''
  } catch (e) {
    console.error(e)
  }
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
    <NoteList
      class="note-list"
      :notes="notes"
      @tree-clicked="(note) => emit('tree-clicked', note)"
      :can-expand-tree="true"
    />
    <Editor class="editor" @create-clicked="create" v-model="input" />
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
