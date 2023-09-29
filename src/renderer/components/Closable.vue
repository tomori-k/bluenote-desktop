<script setup lang="ts"></script>

<template>
  <div class="closable-layout">
    <div class="header">This is closable view.</div>
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
