<script setup lang="ts">
type Props = {
  left: number
  top: number
}
type Emits = {
  (e: 'close-clicked'): void
}
const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="context-menu-layout" @click="() => emit('close-clicked')">
    <div
      class="container"
      v-on:click="(e) => e.stopPropagation()"
      :style="{
        left: `${props.left}px`,
        top: `${props.top}px`,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.context-menu-layout {
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
}

.container {
  background-color: #eeeeee;
  position: absolute;
}
</style>
