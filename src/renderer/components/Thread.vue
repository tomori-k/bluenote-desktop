<script setup lang="ts">
import NoteList from './monologue/NoteList.vue'
import Editor from './Editor.vue'
import { useNoteStore } from '../stores/note'
import { ref } from 'vue'

const input = ref<string>()
const isSyncing = ref(false)
const noteStore = useNoteStore()

async function create() {
  if (!input.value) return

  await noteStore.create(input.value)
  input.value = ''
}

async function sync() {
  isSyncing.value = true
  try {
    await noteStore.sync()
  } finally {
    isSyncing.value = false
  }
}

noteStore.load()
</script>

<template>
  <div class="thread-layout">
    <button type="button" @click="sync">同期</button>
    <div v-if="isSyncing">同期中</div>
    <NoteList class="note-list" :notes="noteStore.notes" />
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
