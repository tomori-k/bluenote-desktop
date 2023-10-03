<script setup lang="ts">
import HoverMenu from './HoverMenu.vue'
import { marked } from 'marked'

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
  previewNote?: string | null
}
type Emits = {
  (e: 'reach-top'): void
  (e: 'tree-clicked', note: Note): void
  (e: 'edit-clicked', note: Note): void
  (e: 'remove-clicked', note: Note): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()

marked.use({
  breaks: true,
  renderer: {
    heading(text: string, level: number) {
      return '#'.repeat(level) + ' ' + text
    },
    html(html: string) {
      return html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/\'/g, '&#x27;')
        .replace(/`/g, '&#x60')
    },
  },
})
</script>
<template>
  <div class="note-list-root">
    <div v-for="note in props.notes" class="note">
      <div v-html="marked.parse(note.content)"></div>
      <HoverMenu
        class="hover-menu"
        :tree-button="canExpandTree"
        @tree-clicked="emit('tree-clicked', note)"
        @edit-clicked="emit('edit-clicked', note)"
        @remove-clicked="emit('remove-clicked', note)"
      />
    </div>
    <div class="note">
      <div
        v-if="props.previewNote"
        v-html="marked.parse(props.previewNote)"
      ></div>
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
