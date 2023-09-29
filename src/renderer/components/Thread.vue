<script setup lang="ts">
import NoteList from './monologue/NoteList.vue'
import Editor from './Editor.vue'
</script>

<template>
  <div class="thread-layout">
    <NoteList class="note-list" />
    <Editor class="editor" />
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
