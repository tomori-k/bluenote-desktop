import { useEffect, useState } from 'react'
import SettingsIcon from './icons/SettingsIcon'
import CloseIcon from './icons/CloseIcon'
import { Device } from '@prisma/client'

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

function useInitServerEffect(
  isRunning: boolean,
  onInitServerStateChanged: (isRunning: boolean) => void
) {
  useEffect(() => {
    if (!isRunning) {
      return
    }

    window.bluetooth.addOnInitServerStateChanged(onInitServerStateChanged)
    window.bluetooth.startInitServer() // fire and forget

    return () => {
      window.bluetooth.stopInitServer()
      window.bluetooth.removeOnInitServerStateChanged(onInitServerStateChanged)
    }
  }, [isRunning])
}

function Button({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      className="dark:bg-midnight-800 hover:dark:bg-midnight-600 dark:border-midnight-600 rounded-md border px-4 py-2 text-xs"
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function Switch({ id }: { id: string }) {
  return <input id={id} type="checkbox" />
}

function SettingsSideMenuItem({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode
  selected: boolean
  onClick?: () => void
}) {
  return (
    <li
      className={
        'flex h-7 items-center rounded pl-4 text-sm' +
        (selected ? ' dark:bg-midnight-600' : '')
      }
      onClick={onClick}
    >
      {children}
    </li>
  )
}

function DeviceList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="dark:border-midnight-600 rounded-2xl border p-2">
      {children}
    </ul>
  )
}

function DeviceListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="hover:dark:bg-midnight-600 group flex h-7 items-center justify-between rounded-md p-2 text-xs">
      {children}
    </li>
  )
}

function DeviceListItemWithDelete({
  children,
  onDeleteClick,
}: {
  children: React.ReactNode
  onDeleteClick?: () => void
}) {
  return (
    <DeviceListItem>
      {children}
      <button
        type="button"
        className="invisible group-hover:visible"
        onClick={onDeleteClick}
      >
        <CloseIcon />
      </button>
    </DeviceListItem>
  )
}

function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3 px-4">{children}</div>
}

function SettingsItem({
  title,
  description,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-x-14">
      <div>
        <h4 className="text-sm">{title}</h4>
        <p className="text-xs">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Appearance() {
  return (
    <SettingsLayout>
      <h3>外観設定</h3>

      <SettingsItem title="テーマ">
        <select>
          <option>ライト</option>
          <option>ダーク</option>
        </select>
      </SettingsItem>
    </SettingsLayout>
  )
}

function DataSync({ onAddSyncDevice }: { onAddSyncDevice: () => void }) {
  const [hasErrorOccured, setHasErrorOccured] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    async function getSyncDevices() {
      try {
        const devices = await window.api.getSyncEnabledDevices()
        setDevices(devices)
      } catch (e) {
        setHasErrorOccured(true)
      }
    }

    getSyncDevices()

    return () => {
      // TODO: abort
    }
  }, [])

  return (
    <SettingsLayout>
      <h3>データ同期</h3>

      <SettingsItem
        title="データ同期の有効化"
        description={
          <label htmlFor="data-sync-enabled">
            Bluetoothを使用して、他の端末とデータを同期します
          </label>
        }
      >
        <Switch id="data-sync-enabled" />
      </SettingsItem>

      <SettingsItem
        title="アプリが起動中はPCをスリープしない"
        description={
          <label htmlFor="prevent-from-sleep">
            PCがスリープしている間は、データの共有が停止するため、PCが勝手にスリープに移行しないようにします。
          </label>
        }
      >
        <Switch id="prevent-from-sleep" />
      </SettingsItem>

      <div className="flex items-center justify-between">
        <h3 className="text-sm">同期する端末</h3>
        <Button onClick={onAddSyncDevice}>追加</Button>
      </div>

      {hasErrorOccured && <p className="text-red-600">エラーが発生しました</p>}

      <DeviceList>
        {devices.map((device) => (
          <DeviceListItemWithDelete key={device.id}>
            {device.name}
          </DeviceListItemWithDelete>
        ))}
      </DeviceList>
    </SettingsLayout>
  )
}

function AddSyncDevice() {
  const [blState, setBlState] = useState({
    isScanning: false,
    isInitServerRunning: false,
  })
  const [scannedDevices, setScannedDevices] = useState<
    {
      name: string
      windowsDeviceId: string
    }[]
  >([])

  function onScanStateChanged(state: boolean) {
    setBlState({ isScanning: state, isInitServerRunning: false })
  }

  function onDeviceFound(device: { name: string; windowsDeviceId: string }) {
    setScannedDevices([...scannedDevices, device])
  }

  function onInitServerStateChanged(state: boolean) {
    setBlState({ isScanning: false, isInitServerRunning: state })
  }

  useBluetoothScanEffect(blState.isScanning, onScanStateChanged, onDeviceFound)
  useInitServerEffect(blState.isInitServerRunning, onInitServerStateChanged)

  return (
    <SettingsLayout>
      <h3>同期するデバイスの追加</h3>

      <SettingsItem
        title="追加リクエストの受付"
        description="しばらくの間、近くのデバイスから同期設定のリクエストを受け付けます。"
      >
        <Button>接続受付</Button>
      </SettingsItem>

      <SettingsItem
        title="デバイスのスキャン"
        description={
          <>
            同期設定待ちのデバイスをスキャンします。
            <br />
            同期相手として設定したいデバイスをクリックしてください。
          </>
        }
      >
        <Button
          onClick={() =>
            setBlState({
              isScanning: !blState.isScanning,
              isInitServerRunning: false,
            })
          }
        >
          スキャン{blState.isScanning ? '停止' : '開始'}
        </Button>
      </SettingsItem>

      <div>
        <h4 className="mb-2 text-sm">スキャンされたデバイス：</h4>
        <DeviceList>
          {scannedDevices.map((device) => (
            <DeviceListItem>{device.name}</DeviceListItem>
          ))}
        </DeviceList>
      </div>
    </SettingsLayout>
  )
}

enum SettingsTab {
  Appearance,
  DataSync,
  AddSyncDevice,
}

export default function Settings({ onClose }: SettingsProps) {
  const [tab, setTab] = useState(SettingsTab.Appearance)

  return (
    <div
      className="dark:bg-midnight-950 absolute left-0 top-0 h-screen w-screen bg-opacity-70"
      onClick={onClose}
    >
      <div
        className="dark:bg-midnight-800 dark:border-midnight-600 absolute left-[calc(50vw-600px/2)] top-[calc(50vh-500px/2)] z-10 grid h-[500px] w-[600px] grid-rows-[auto_1fr] rounded-3xl border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="flex h-14 items-center gap-4 pl-7 text-xl">
          <SettingsIcon className="h-5 w-5" />
          設定
        </h2>
        <div className="divide-midnight-100 dark:divide-midnight-600 grid h-full grid-cols-[auto_1fr] divide-x pb-2">
          <ul className="w-36 px-2">
            <SettingsSideMenuItem
              selected={tab === SettingsTab.Appearance}
              onClick={() => setTab(SettingsTab.Appearance)}
            >
              外観
            </SettingsSideMenuItem>
            <SettingsSideMenuItem
              selected={
                tab === SettingsTab.DataSync ||
                tab === SettingsTab.AddSyncDevice
              }
              onClick={() => setTab(SettingsTab.DataSync)}
            >
              データ同期
            </SettingsSideMenuItem>
          </ul>

          {tab === SettingsTab.Appearance ? (
            <Appearance />
          ) : tab === SettingsTab.DataSync ? (
            <DataSync
              onAddSyncDevice={() => setTab(SettingsTab.AddSyncDevice)}
            />
          ) : tab === SettingsTab.AddSyncDevice ? (
            <AddSyncDevice />
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  )
}
