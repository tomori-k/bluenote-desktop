<script setup lang="ts">
import { useThreadStore } from '../stores/thread'
type Thread = {
  id: string
  name: string
  displayMode: 'monologue' | 'scrap'
  createdAt: Date
  removed: boolean
  removedAt: Date
}
type Emits = {
  (e: 'settings-clicked'): void
  (e: 'trash-clicked'): void
  (e: 'thread-clicked', thread: Thread): void
}
const emit = defineEmits<Emits>()

const threadStore = useThreadStore()

async function createThread() {
  await threadStore.create('new thread', 'monologue')
}

threadStore.load()
</script>
<template>
  <div>
    スレッド
    <div>
      <button type="button" @click="createThread">追加</button>
    </div>
    <ul>
      <li
        v-for="thread in threadStore.threads"
        @click="() => emit('thread-clicked', thread)"
      >
        {{ thread.name }}, {{ thread.displayMode }}
      </li>
    </ul>
    <ul>
      <li @click="() => emit('trash-clicked')">ごみ箱</li>
      <li @click="() => emit('settings-clicked')">設定</li>
    </ul>
  </div>
</template>
