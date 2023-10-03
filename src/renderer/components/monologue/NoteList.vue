<script setup lang="ts">
import HoverMenu from './HoverMenu.vue'

type Note = {
  id: string
  content: string
  editorId: string
  createdAt: Date
  updatedAt: Date
  threadId: string
  parentId: string | null
  removed: boolean
  removedAt: Date
}
type Props = {
  notes: Note[]
  canExpandTree: boolean
}
type Emits = {
  (e: 'reach-top'): void
  (e: 'tree-clicked', note: Note): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
<template>
  <div class="note-list-root">
    <div v-for="note in props.notes" class="note">
      {{ note.id }},{{ note.content }},{{ note.editorId }},{{
        note.createdAt
      }},{{ note.updatedAt }}
      <HoverMenu
        class="hover-menu"
        :tree-button="canExpandTree"
        @tree-clicked="emit('tree-clicked', note)"
      />
    </div>
  </div>
</template>

<style scoped>
.note-list-root {
  overflow-y: auto;
}

.note {
  position: relative;
  word-break: break-all;
}

.hover-menu {
  position: absolute;
  right: 0;
  top: 0;
  display: none;
}

.note:hover > .hover-menu {
  display: block;
}
</style>
