<script setup lang="ts">
type Emits = {
  (e: 'close-clicked'): void
}
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="closable-layout">
    <div class="header">
      This is closable view.
      <button type="button" @click="() => emit('close-clicked')">閉じる</button>
    </div>
    <slot class="content" />
  </div>
</template>

<style scoped>
.closable-layout {
  display: grid;
  grid-template-rows: auto 1fr;
}

.header {
  grid-row: 1/2;
}

.content {
  grid-row: 2/3;
}
</style>
