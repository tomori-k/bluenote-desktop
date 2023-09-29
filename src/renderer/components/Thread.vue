<script setup lang="ts">
import NoteList from './monologue/NoteList.vue'
import Editor from './Editor.vue'
import { useNoteStore } from '../stores/note'
import { ref } from 'vue'

const input = ref<string>()
const noteStore = useNoteStore()

async function create() {
  if (!input.value) return

  await noteStore.create(input.value)
  input.value = ''
}

noteStore.load()
</script>

<template>
  <div class="thread-layout">
    <NoteList class="note-list" :notes="noteStore.notes" />
    <Editor class="editor" @create-clicked="create" v-model="input" />
  </div>
</template>

<style scoped>
.thread-layout {
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
