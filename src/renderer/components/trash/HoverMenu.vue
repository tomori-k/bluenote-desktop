<script setup lang="ts">
type Emits = {
  (e: 'restore-clicked'): void
  (e: 'delete-clicked'): void
}
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="hover-menu-layout">
    <button type="button" @click="emit('restore-clicked')">←</button>
    <button type="button" @click="emit('delete-clicked')">X</button>
  </div>
</template>

<style scoped>
.hover-menu-layout {
  display: flex;
  align-items: center;
  background-color: #eeeeee;
}
</style>
