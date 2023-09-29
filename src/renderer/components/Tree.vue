<script setup lang="ts">
import Closable from './Closable.vue'
import Editor from './Editor.vue'
import NoteList from './monologue/NoteList.vue'

type Emits = {
  (e: 'close-clicked'): void
}
const emit = defineEmits<Emits>()
</script>

<template>
  <Closable @close-clicked="() => emit('close-clicked')">
    <div class="tree-layout">
      <NoteList class="note-list" />
      <Editor class="editor" />
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
