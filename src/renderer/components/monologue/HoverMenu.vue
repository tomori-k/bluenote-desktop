<script setup lang="ts">
type Emits = {
  (e: 'tree-clicked'): void
  (e: 'edit-clicked'): void
  (e: 'remove-clicked'): void
}
type Props = {
  treeButton: boolean
}
const emit = defineEmits<Emits>()
const props = defineProps<Props>()
</script>

<template>
  <div class="hover-menu-layout">
    <button v-if="props.treeButton" type="button" @click="emit('tree-clicked')">
      +
    </button>
    <button type="button" @click="emit('edit-clicked')">/</button>
    <button type="button" @click="emit('remove-clicked')">d</button>
  </div>
</template>

<style scoped>
.hover-menu-layout {
  display: flex;
  align-items: center;
  background-color: #eeeeee;
}
</style>
