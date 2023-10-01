<script setup lang="ts">
import SideMenu from './SideMenu.vue'
import ThreadView from './ThreadView.vue'
import Tree from './Tree.vue'
import SearchResult from './SearchResult.vue'
import { ref } from 'vue'
import Trash from './Trash.vue'
import { Thread } from '../../common/thread'
import { Note } from '../../common/note'

type Props = {
  showMenu: boolean
}
type Emits = {
  (e: 'settings-clicked'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showTree = ref(true)
const showSearchResult = ref(true)
const showTrash = ref(true)

const thread = ref<Thread>()
const note = ref<Note>() // ツリー
</script>

<template>
  <div class="main-layout">
    <SideMenu
      class="sidemenu"
      @settings-clicked="() => emit('settings-clicked')"
      @trash-clicked="() => (showTrash = !showTrash)"
      @thread-clicked="(th) => (thread = th)"
      v-show="props.showMenu"
    />
    <ThreadView
      class="thread"
      :thread="thread"
      @note-clicked="
        (n) => {
          note = n
          showTree = true
        }
      "
    />
    <Tree
      class="tree"
      v-show="showTree"
      @close-clicked="() => (showTree = false)"
      :note="note"
    />
    <SearchResult
      class="search-result"
      v-show="showSearchResult"
      @close-clicked="() => (showSearchResult = false)"
    />
    <Trash
      class="trash"
      v-show="showTrash"
      @close-clicked="() => (showTrash = false)"
    />
  </div>
</template>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  grid-template-rows: minmax(0, 1fr); /* これ罠やなー */
}

.sidemenu {
  grid-column: 1/2;
}

.thread {
  grid-column: 2/3;
}

.tree {
  grid-column: 3/4;
}

.search-result {
  grid-column: 4/5;
}

.trash {
  grid-column: 5/6;
}
</style>
