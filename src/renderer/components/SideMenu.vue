<script setup lang="ts">
type Emits = {
  (e: 'settings-clicked'): void
  (e: 'trash-clicked'): void
}
const emit = defineEmits<Emits>()
</script>
<template>
  <div>
    スレッド
    <ul>
      <li>めいん</li>
      <li>さぶ</li>
    </ul>
    <ul>
      <li @click="() => emit('trash-clicked')">ごみ箱</li>
      <li @click="() => emit('settings-clicked')">設定</li>
    </ul>
  </div>
</template>
