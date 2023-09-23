import { ref, onMounted, onUnmounted } from 'vue'

export function useBluetoothDiscoverableState() {
  const isDiscoverable = ref(false)

  function onStateChanged(state: boolean) {
    isDiscoverable.value = state
  }

  onMounted(() => {
    window.electronApi.setOnBluetoothDiscoverableStateChanged(onStateChanged)
  })
  onUnmounted(() => {
    window.electronApi.removeOnBluetoothDiscoverableStateChanged(onStateChanged)
  })

  return { isDiscoverable }
}
