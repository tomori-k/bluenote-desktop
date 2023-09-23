<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBluetoothScanState } from './composables/BluetoothScanState'
import { useBluetoothDiscoverableState } from './composables/BluetoothDiscoverableState'

const bluetoothScanState = useBluetoothScanState()
const bluetoothDiscoverableState = useBluetoothDiscoverableState()

function startBluetoothScan() {
  window.electronApi.startBluetoothScan()
}

function makeDiscoverable() {
  window.electronApi.makeDiscoverable()
}

type PairingRequest = {
  deviceName: string
  pin: string
}

const pairingRequest = {
  request: ref<PairingRequest | null>(),
  _respond: null as ((accept: boolean) => void) | null,
  on(deviceName: string, pin: string, respond: (accept: boolean) => void) {
    this.request.value = { deviceName: deviceName, pin: pin }
    this._respond = respond
  },
  respond(accept: boolean) {
    this.request.value = null
    if (this._respond != null) this._respond(accept)
  },
}

const devices = ref<BluetoothDevice[]>([])

function accept() {
  pairingRequest.respond(true)
}

function reject() {
  pairingRequest.respond(false)
}

function requestPairing(device: BluetoothDevice) {
  window.electronApi.requestPairing(device.id)
}

// todo: デバイス名も渡す
async function onPairingRequested(deviceName: string, pin: string) {
  return await new Promise<boolean>((respond) => {
    pairingRequest.on(deviceName, pin, respond)
  })
}

type BluetoothDevice = {
  name: string
  id: string
}

function onBluetoothDeviceFound(device: BluetoothDevice) {
  devices.value.push(device)
}

onMounted(() => {
  window.electronApi.setOnPairingRequested(onPairingRequested)
  window.electronApi.setOnBluetoothDeviceFound(onBluetoothDeviceFound)
})

onUnmounted(() => {
  window.electronApi.removeOnPairingRequested(onPairingRequested)
  window.electronApi.removeOnBluetoothDeviceFound(onBluetoothDeviceFound)
})
</script>

<template>
  <div v-if="bluetoothScanState.isScanning.value">デバイスを検出中...</div>
  <div v-if="bluetoothDiscoverableState.isDiscoverable.value">
    他の端末から検出可能です。
  </div>
  <div>
    <button type="button" @click="startBluetoothScan">検出</button>
    <button type="button" @click="makeDiscoverable">待機</button>
  </div>
  <div v-if="pairingRequest.request.value != null">
    Device: {{ pairingRequest.request.value.deviceName }} <br />
    PIN : {{ pairingRequest.request.value.pin }}
    <div>
      <button type="button" @click="accept">許可</button>
      <button type="button" @click="reject">拒否</button>
    </div>
  </div>
  <ul>
    <li v-for="device in devices" @click="() => requestPairing(device)">
      {{ device.name }},{{ device.id }}
    </li>
  </ul>
</template>

<style scoped></style>
