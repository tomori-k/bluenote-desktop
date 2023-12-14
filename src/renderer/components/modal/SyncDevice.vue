<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

type BluetoothDevice = {
  name: string
  windowsDeviceId: string
}

type BondRequest = {
  deviceName: string
  pin: string
}

const isScanning = ref(false)
const isListeningSyncInitRequest = ref(false)
const devices = ref<BluetoothDevice[]>([])
const bonding = {
  request: ref<BondRequest | null>(),

  _respond: null as ((accept: boolean) => void) | null,

  onRequested(
    deviceName: string,
    pin: string,
    respond: (accept: boolean) => void
  ) {
    this.request.value = { deviceName: deviceName, pin: pin }
    this._respond = respond
  },

  respond(accept: boolean) {
    this.request.value = null
    if (this._respond != null) this._respond(accept)
  },
}

function onStateChanged(state: boolean) {
  isScanning.value = state
}

function onSyncListenStateChanged(isListening: boolean) {
  isListeningSyncInitRequest.value = isListening
}

function onBluetoothDeviceFound(device: BluetoothDevice) {
  devices.value.push(device)
}

function startBluetoothScan() {
  devices.value = []
  window.bluetooth.startBluetoothScan()
}

function requestSyncInit(device: BluetoothDevice) {
  window.bluetooth.requestSync(device.windowsDeviceId)
}

async function onBondRequested(deviceName: string, pin: string) {
  return await new Promise<boolean>((respond) => {
    bonding.onRequested(deviceName, pin, respond)
  })
}

function listenSyncInit() {
  window.bluetooth.listenSyncRequest()
}

onMounted(() => {
  window.bluetooth.addOnBluetoothScanStateChanged(onStateChanged)
  window.bluetooth.addOnSyncListenStateChanged(onSyncListenStateChanged)
  window.bluetooth.addOnBluetoothDeviceFound(onBluetoothDeviceFound)
  window.bluetooth.setOnBondRequested(onBondRequested)
})

onUnmounted(() => {
  window.bluetooth.removeOnBluetoothScanStateChanged(onStateChanged)
  window.bluetooth.removeOnSyncListenStateChanged(onSyncListenStateChanged)
  window.bluetooth.removeOnBluetoothDeviceFound(onBluetoothDeviceFound)
  window.bluetooth.removeOnBondRequested(onBondRequested)
})
</script>
<template>
  <div>
    <h2>同期するデバイスの追加</h2>

    <div class="settings">
      <div class="title">
        <h3>追加リクエストの受付</h3>
        <p>
          しばらくの間、近くのデバイスから同期設定のリクエストを受け付けます。
        </p>
        <div v-if="isListeningSyncInitRequest">受付中...</div>
      </div>
      <button class="input" type="button" @click="listenSyncInit">
        接続受付
      </button>
    </div>

    <div class="settings">
      <div class="title">
        <h3>デバイスのスキャン</h3>
        <p>
          同期設定待ちのデバイスをスキャンします。<br />同期相手として設定したいデバイスをクリックしてください。
        </p>
      </div>
      <button class="input" type="button" @click="startBluetoothScan">
        スキャン
      </button>
      <div v-if="isScanning">スキャン中...</div>
    </div>

    <div v-if="bonding.request.value != null">
      Device: {{ bonding.request.value.deviceName }} <br />
      PIN : {{ bonding.request.value.pin }}
      <div>
        <button type="button" @click="bonding.respond(true)">許可</button>
        <button type="button" @click="bonding.respond(false)">拒否</button>
      </div>
    </div>

    <ul>
      <li v-for="device in devices" @click="requestSyncInit(device)">
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
</style>
