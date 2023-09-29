<script setup lang="ts"></script>

<template>
  <div class="editor-layout">
    <input type="text" placeholder="メモを入力" class="note-input" />
    <button type="button" class="create-button">追加</button>
  </div>
</template>

<style scoped>
.editor-layout {
  display: grid;
  grid-template-columns: 1fr auto;
}

.note-input {
  grid-column: 1/2;
}

.create-button {
  grid-column: 2/3;
}
</style>
