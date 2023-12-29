import { contextBridge } from 'electron'
import { api } from './api'
import { bluetooth } from './bluetooth'
import { settingsApi } from './settings'

// プリロードスクリプトから何かを export すると上手く読み込めなくなる（electron の制約？）
// → エントリポイントのファイル（これ）に export と記述すると、esbuild での生成物に
//   module.exports の記述が含まれ、プリロードスクリプトの読み込みに失敗するという罠がある

contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('bluetooth', bluetooth)
contextBridge.exposeInMainWorld('settings', settingsApi)
