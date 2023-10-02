<script setup lang="ts">
type Emits = {
  (e: 'close-clicked'): void
}
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="settings-layout" @click="() => emit('close-clicked')">
    <div class="container" v-on:click="(e) => e.stopPropagation()">
      設定
      <button type="button" @click="() => emit('close-clicked')">閉じる</button>
      <ul>
        <li>外観</li>
        <li>データ同期</li>
      </ul>

      <label for="is-sync-snabled">データ同期</label>
      <input type="checkbox" id="is-sync-enabled" />

      <label for="is-sync-snabled">アプリ起動中はPCをスリープさせない</label>
      <input type="checkbox" id="is-sync-enabled" />

      <div>
        同期する端末
        <button type="button">追加</button>
        <ul>
          <li>Pixel 7</li>
          <li>Pixel 6a</li>
          <li>TK</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-layout {
  background: #000000a1;
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
}

.container {
  margin: auto;
  height: calc(100vh - 32px);
  max-width: 600px;
  max-height: 500px;
  background-color: white;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}
</style>
