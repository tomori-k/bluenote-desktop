import { ref, onMounted, onUnmounted } from 'vue'

// これは pinia 使ったほうがいいですね...。

export function useBluetoothScanState() {
  const isScanning = ref(false)

  function onStateChanged(state: boolean) {
    isScanning.value = state
  }

  onMounted(() => {
    window.electronApi.setOnBluetoothScanStateChanged(onStateChanged)
  })
  onUnmounted(() => {
    window.electronApi.removeOnBluetoothScanStateChanged(onStateChanged)
  })

  return { isScanning }
}
