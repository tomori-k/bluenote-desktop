import { Api } from './api'
import { Bluetooth } from './bluetooth'
import { SettingsApi } from './settings'

// renderer 用 global の型定義

declare global {
  interface Window {
    api: Api
    bluetooth: Bluetooth
    settings: SettingsApi
  }
}
