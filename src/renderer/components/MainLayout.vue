<script setup lang="ts">
import SideMenu from './SideMenu.vue'
import Thread from './Thread.vue'
import Tree from './Tree.vue'
import SearchResult from './SearchResult.vue'
import { ref } from 'vue'

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
</script>

<template>
  <div class="main-layout">
    <SideMenu
      class="sidemenu"
      @settings-clicked="() => emit('settings-clicked')"
      v-show="props.showMenu"
    />
    <Thread class="thread" />
    <Tree
      class="tree"
      v-show="showTree"
      @close-clicked="() => (showTree = false)"
    />
    <SearchResult
      class="search-result"
      v-show="showSearchResult"
      @close-clicked="() => (showSearchResult = false)"
    />
  </div>
</template>

<style scoped>
.main-layout {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
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
</style>
