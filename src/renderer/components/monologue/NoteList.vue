<script setup lang="ts">
type Note = {
  id: string
  content: string
  editorId: string
  createdAt: Date
  updatedAt: Date
}
type Props = {
  notes: Note[]
}
type Emits = {
  (e: 'reach-top'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>
<template>
  <ul>
    <li v-for="note in props.notes">
      {{ note.id }},{{ note.content }},{{ note.editorId }},{{
        note.createdAt
      }},{{ note.updatedAt }}
    </li>
  </ul>
</template>
