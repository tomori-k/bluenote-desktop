<script setup lang="ts">
import SideMenu from './SideMenu.vue'
import Thread from './Thread.vue'
import Tree from './Tree.vue'
import SearchResult from './SearchResult.vue'
</script>

<template>
  <div class="main-layout">
    <SideMenu class="sidemenu" />
    <Thread class="thread" />
    <Tree class="tree" />
    <SearchResult class="search-result" />
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
