import { useEffect, useState } from 'react'

type SettingsProps = {
  onClose: () => void
}

function useBluetoothScanEffect(
  isScanning: boolean,
  onScanStateChanged: (isScanning: boolean) => void,
  onDeviceFound: (device: { name: string; windowsDeviceId: string }) => void
) {
  useEffect(() => {
    if (!isScanning) {
      return
    }

    window.bluetooth.addOnBluetoothDeviceFound(onDeviceFound)
    window.bluetooth.addOnBluetoothScanStateChanged(onScanStateChanged)
    window.bluetooth.startBluetoothScan()

    return () => {
      window.bluetooth.stopBluetoothScan()
      window.bluetooth.removeOnBluetoothScanStateChanged(onScanStateChanged)
      window.bluetooth.removeOnBluetoothDeviceFound(onDeviceFound)
    }
  }, [isScanning])
}

export default function Settings({ onClose }: SettingsProps) {
  const [isScanning, setIsScanning] = useState(false)

  function onScanStateChanged(state: boolean) {
    setIsScanning(state)
  }

  function onDeviceFound(device: { name: string; windowsDeviceId: string }) {
    console.log(`${device.name},${device.windowsDeviceId}`)
  }

  useBluetoothScanEffect(isScanning, onScanStateChanged, onDeviceFound)

  return (
    <div
      className="bg-midnight-950 absolute left-0 top-0 h-screen w-screen bg-opacity-70"
      onClick={onClose}
    >
      <div
        className="bg-midnight-800 border-midnight-600 absolute left-[calc(50vw-600px/2)] top-[calc(50vh-500px/2)] z-10 h-[500px] w-[600px] rounded-md border"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={() => setIsScanning(!isScanning)}>
          スキャン{isScanning ? '停止' : '開始'}
        </button>
      </div>
    </div>
  )
}
