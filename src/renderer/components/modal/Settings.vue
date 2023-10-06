<script setup lang="ts">
import { ref } from 'vue'
import AppearanceOptions from './AppearanceOptions.vue'
import SyncSettings from './SyncSettings.vue'
import SyncDevice from './SyncDevice.vue'

enum SettingsPage {
  Appearance,
  DataSync,
  DataSyncDevice,
}

type Emits = {
  (e: 'close-clicked'): void
}
const emit = defineEmits<Emits>()

const page = ref(SettingsPage.Appearance)
</script>

<template>
  <div class="settings-layout" @click="() => emit('close-clicked')">
    <div class="container" v-on:click="(e) => e.stopPropagation()">
      <div class="header">
        設定
        <button type="button" @click="() => emit('close-clicked')">
          閉じる
        </button>
      </div>

      <ul class="menu">
        <li @click="page = SettingsPage.Appearance">外観</li>
        <li @click="page = SettingsPage.DataSync">データ同期</li>
      </ul>

      <AppearanceOptions
        class="content"
        v-show="page === SettingsPage.Appearance"
      />
      <SyncSettings
        class="content"
        v-show="page === SettingsPage.DataSync"
        @add-device-clicked="page = SettingsPage.DataSyncDevice"
      />
      <SyncDevice
        class="content"
        v-show="page === SettingsPage.DataSyncDevice"
      />
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
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr;
}

.header {
  grid-row: 1/2;
  grid-column: 1/3;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu {
  grid-row: 2/3;
  grid-column: 1/2;
}

.content {
  grid-row: 2/3;
  grid-column: 2/3;
}
</style>
