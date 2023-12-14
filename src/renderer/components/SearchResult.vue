<script setup lang="ts">
import { ref, watch } from 'vue'
import Closable from './Closable.vue'
import { Note } from '../../common/note'
import NoteListView from './monologue/NoteListView.vue'

type Props = {
  searchOption: {
    text: string
  }
}
type Emits = {
  (e: 'close-clicked'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const notes = ref<Note[]>([])
let optionChangedCount = 0

watch(
  () => props.searchOption,
  async () => {
    let count = ++optionChangedCount
    await new Promise((r) => setTimeout(r, 300))
    if (optionChangedCount === count) {
      await search()
    }
  }
)

async function search() {
  if (!props.searchOption.text) return

  notes.value.length = 0

  // for (const note of await window.api.searchNote({
  //   text: props.searchOption.text,
  // })) {
  //   notes.value.push(note)
  // }
}
</script>

<template>
  <Closable @close-clicked="() => emit('close-clicked')">
    <NoteListView :notes="notes" :can-expand-tree="false" />
  </Closable>
</template>
