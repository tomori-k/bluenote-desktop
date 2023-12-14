import { contextBridge } from 'electron'
import { electronApi } from './electron-api'
import { api } from './api'
import { bluetooth } from './bluetooth'

// プリロードスクリプトから何かを export すると上手く読み込めなくなる（electron の制約？）
// → エントリポイントのファイル（これ）に export と記述すると、esbuild での生成物に
//   module.exports の記述が含まれ、プリロードスクリプトの読み込みに失敗するという罠がある

contextBridge.exposeInMainWorld('electronApi', electronApi)
contextBridge.exposeInMainWorld('api', api)
contextBridge.exposeInMainWorld('bluetooth', bluetooth)
