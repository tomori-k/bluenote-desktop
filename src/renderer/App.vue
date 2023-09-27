<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBluetoothScanState } from './composables/BluetoothScanState'

const bluetoothScanState = useBluetoothScanState()

function startBluetoothScan() {
  window.electronApi.startBluetoothScan()
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

type Note = {
  id: string
  content: string
  editor: string
  createdAt: Date
  updatedAt: Date
}

const input = ref<string>()
const notes = ref<Note[]>([])

function create() {
  if (!input.value) return

  const timestamp = new Date()
  notes.value.push({
    id: 'id',
    content: input.value,
    editor: 'editor',
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  input.value = ''
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

async function load() {
  for (const note of await window.electronApi.getAllNotes()) {
    notes.value.push(note)
  }
}

onMounted(async () => {
  window.electronApi.setOnPairingRequested(onPairingRequested)
  window.electronApi.setOnBluetoothDeviceFound(onBluetoothDeviceFound)
  await load()
})

onUnmounted(() => {
  window.electronApi.removeOnPairingRequested(onPairingRequested)
  window.electronApi.removeOnBluetoothDeviceFound(onBluetoothDeviceFound)
})
</script>

<template>
  <div v-if="bluetoothScanState.isScanning.value">デバイスを検出中...</div>
  <div>
    <button type="button" @click="startBluetoothScan">検出</button>
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
  <p>メモ</p>
  <ul>
    <li v-for="note in notes">
      {{ note.id }},{{ note.content }},{{ note.editor }},{{ note.createdAt
      }}{{ note.updatedAt }}
    </li>
  </ul>
  <div>
    <input type="text" placeholder="ここにメモを入力" v-model="input" />
    <button type="button" @click="create">追加</button>
  </div>
  <div>
    <button type="button" @click="load">更新分取得</button>
  </div>
</template>

<style scoped></style>
