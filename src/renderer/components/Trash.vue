<script setup lang="ts">
import Closable from './Closable.vue'
import NoteList from './monologue/NoteList.vue'

type Emits = {
  (e: 'close-clicked'): void
}
const emit = defineEmits<Emits>()
</script>

<template>
  <Closable @close-clicked="() => emit('close-clicked')">
    ごみばこ
    <NoteList :notes="[]" :can-expand-tree="false" />
  </Closable>
</template>
