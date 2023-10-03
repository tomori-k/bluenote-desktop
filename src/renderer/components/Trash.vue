<script setup lang="ts">
import Closable from './Closable.vue'
import NoteListView from './monologue/NoteListView.vue'

type Emits = {
  (e: 'close-clicked'): void
}
const emit = defineEmits<Emits>()
</script>

<template>
  <Closable @close-clicked="() => emit('close-clicked')">
    ごみばこ
    <NoteListView :notes="[]" :can-expand-tree="false" />
  </Closable>
</template>
