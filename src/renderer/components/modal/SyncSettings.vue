<script setup lang="ts">
import { onMounted, ref } from 'vue'

type SyncDevice = {
  uuid: string
  name: string
}
type Emits = {
  (e: 'add-device-clicked'): void
}
const emit = defineEmits<Emits>()

const devices = ref<SyncDevice[]>([])

async function disableSync(device: SyncDevice) {
  await window.bluetooth.disableSync(device.uuid)

  const idx = devices.value.findIndex((x) => x.uuid === device.uuid)
  if (idx === -1) throw new Error('device not found')

  devices.value.splice(idx, 1)
}

onMounted(async () => {
  devices.value = await window.bluetooth.getSyncDevices()
})
</script>

<template>
  <div>
    <div class="settings">
      <label class="title" for="is-sync-enabled">データ同期</label>
      <input class="input" type="checkbox" id="is-sync-enabled" />
    </div>

    <div class="settings">
      <label class="title" for="prevent-from-sleep"
        >アプリ起動中はPCをスリープさせない</label
      >
      <input class="input" type="checkbox" id="prevent-from-sleep" />
    </div>

    <div class="settings">
      <p class="title">同期する端末</p>
      <button class="input" type="button" @click="emit('add-device-clicked')">
        追加
      </button>
    </div>

    <ul class="sync-device-list">
      <li
        v-for="device in devices"
        @click="async () => await disableSync(device)"
      >
        {{ device.name }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.settings {
  display: grid;
  grid-template-columns: 1fr 100px;
}

.title {
  grid-column: 1/2;
}

.input {
  grid-column: 2/3;
}

.sync-device-list {
  grid-column: 1/3;
  grid-row: 4/5;
  max-height: 200px;
}
</style>
