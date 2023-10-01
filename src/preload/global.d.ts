import { Api } from './api'
import { ElectronApi } from './electron-api'

// renderer 用 global の型定義

declare global {
  interface Window {
    electronApi: ElectronApi
    api: Api
  }
}
