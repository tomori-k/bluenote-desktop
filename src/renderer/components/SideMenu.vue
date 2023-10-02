<script setup lang="ts">
import { useThreadStore } from '../stores/thread'
import { Thread } from '../../common/thread'
import { computed, ref } from 'vue'

type Emits = {
  (e: 'settings-clicked'): void
  (e: 'trash-clicked'): void
  (e: 'thread-clicked', thread: Thread): void
}
const emit = defineEmits<Emits>()

const threadStore = useThreadStore()
const threads = computed(() =>
  threadStore.threads.map((thread) => ({
    renaming: false,
    ...thread,
    inputRef: ref<HTMLInputElement>(),
  }))
)
async function createThread() {
  await threadStore.create('new thread', 'monologue')
}

async function applyRename(
  thread: typeof threads.value extends (infer U)[] ? U : never
) {
  try {
    await threadStore.rename(thread.id, thread.name)
  } finally {
    thread.renaming = false
  }
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
        v-for="thread in threads"
        @click="() => emit('thread-clicked', thread)"
      >
        <span v-if="!thread.renaming">{{ thread.name }}</span>

        <input
          type="text"
          v-model="thread.name"
          v-if="thread.renaming"
          :ref="(e) => (e as HTMLInputElement | null)?.focus()"
          @keypress="
            async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLLIElement).blur()
              }
            }
          "
          @blur="
            async () => {
              if (thread.renaming) {
                await applyRename(thread)
              }
            }
          "
        />

        <button type="button" @click="() => (thread.renaming = true)">a</button>
      </li>
    </ul>
    <ul>
      <li @click="() => emit('trash-clicked')">ごみ箱</li>
      <li @click="() => emit('settings-clicked')">設定</li>
    </ul>
  </div>
</template>

<style scoped></style>
