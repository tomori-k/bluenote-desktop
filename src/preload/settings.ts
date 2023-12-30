import { ipcRenderer } from 'electron'
import { IpcInvokeChannel } from './channel'
import { Settings } from '../common/settings'

export const settingsApi = {
  async getSettings(): Promise<Settings> {
    return await ipcRenderer.invoke(IpcInvokeChannel.GetSettings)
  },
  async transferToMainProcess(settings: Settings): Promise<void> {
    await ipcRenderer.invoke(IpcInvokeChannel.TransferToMain, settings)
  },
}

export type SettingsApi = typeof settingsApi
