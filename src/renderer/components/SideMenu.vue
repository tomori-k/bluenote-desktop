<script setup lang="ts">
import { useThreadStore } from '../stores/thread'
import { Thread } from '../../common/thread'
import ContextMenu from './modal/ContextMenu.vue'
import { computed, ref } from 'vue'

type Emits = {
  (e: 'settings-clicked'): void
  (e: 'trash-clicked'): void
  (e: 'thread-clicked', thread: Thread): void
}
type Element<T> = T extends (infer U)[] ? U : never
const emit = defineEmits<Emits>()

const threadStore = useThreadStore()
const threads = computed(() =>
  threadStore.threads.map((thread) => ({
    renaming: false,
    inputRef: ref<HTMLInputElement>(),
    menuButtonRef: ref<HTMLButtonElement>(),
    ...thread,
  }))
)
const contextMenuState = {
  show: ref(false),
  left: ref(0),
  top: ref(0),
  thread: ref<Element<typeof threads.value> | null>(null),

  open(left: number, top: number, thread: Element<typeof threads.value>) {
    this.show.value = true
    this.left.value = left
    this.top.value = top
    this.thread.value = thread
  },
  close() {
    this.show.value = false
    this.left.value = 0
    this.top.value = 0
    this.thread.value = null
  },
}

async function createThread() {
  await threadStore.create('new thread', 'monologue')
}

async function applyRename(thread: Element<typeof threads.value>) {
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

        <button
          type="button"
          @click="
            () => {
              const bounds = thread.menuButtonRef.value?.getBoundingClientRect()

              if (bounds != null) {
                contextMenuState.open(
                  bounds.left + bounds.width,
                  bounds.top,
                  thread
                )
              }
            }
          "
          :ref="(e) => (thread.menuButtonRef.value = e as HTMLButtonElement)"
        >
          ...
        </button>
      </li>
    </ul>
    <ul>
      <li @click="() => emit('trash-clicked')">ごみ箱</li>
      <li @click="() => emit('settings-clicked')">設定</li>
    </ul>
    <ContextMenu
      v-show="contextMenuState.show.value"
      @close-clicked="() => contextMenuState.close()"
      :left="contextMenuState.left.value"
      :top="contextMenuState.top.value"
    >
      <ul>
        <li
          @click="
            () => {
              if (contextMenuState.thread.value != null) {
                contextMenuState.thread.value.renaming = true
                contextMenuState.close()
              }
            }
          "
        >
          Rename
        </li>
        <li>Remove</li>
        <li>Monologue</li>
        <li>Scrap</li>
      </ul>
    </ContextMenu>
  </div>
</template>

<style scoped></style>
