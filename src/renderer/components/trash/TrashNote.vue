<script setup lang="ts">
import { Note } from '../../../common/note'
import { useThreadStore } from '../../stores/thread'
import HoverMenu from './HoverMenu.vue'

type Props = {
  note: Note
}
type Emits = {
  (e: 'restore-clicked'): void
  (e: 'delete-clicked'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const threadStore = useThreadStore()
</script>

<template>
  <div class="trash-note-layout">
    <div class="thread">{{ threadStore.threadOf(props.note).name }}</div>
    <div class="date">{{ props.note.createdAt }}</div>
    <div class="content">{{ props.note.content }}</div>

    <HoverMenu
      class="hover-menu"
      @restore-clicked="emit('restore-clicked')"
      @delete-clicked="emit('delete-clicked')"
    />
  </div>
</template>

<style scoped>
.trash-note-layout {
  position: relative;
}

.hover-menu {
  position: absolute;
  right: 0;
  top: 0;
  display: none;
}

.trash-note-layout:hover > .hover-menu {
  display: block;
}
</style>
