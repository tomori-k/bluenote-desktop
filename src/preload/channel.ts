/**
 * メインプロセスからレンダラープロセスへのイベント通知に使われるチャネル
 * */
export enum IpcNotificationChannel {
  BluetoothDeviceFound = 'bluetooth-device-found',
  StateBluetoothScan = 'state-bluetooth-scan',
  InitServerStateChanged = 'init-server-state-changed',
  BondRequested = 'bond-requested',
}

const _NewIpcChannel = {
  // bluetooth
  StartBluetoothScan: 'start-bluetooth-scan',
  StopBluetoothScan: 'stop-bluetooth-scan',
  RespondToBondRequest: 'respond-to-bond-request',

  // sync init
  InitSync: 'init-sync',
  StartInitServer: 'start-init-server',
  StopInitServer: 'stop-init-server',

  // sync
  Sync: 'sync',

  // device
  GetSyncEnabledDevices: 'get-sync-enabled-devices',
  DisableSync: 'disable-sync',

  // thread
  GetAllThreads: 'get-all-threads',
  CreateThread: 'create-thread',
  RenameThread: 'rename-thread',
  ChangeDisplayMode: 'change-display-mode',
  RemoveThread: 'remove-thread',

  // note
  FindNotes: 'find-notes',
  FindNotesInThread: 'find-notes-in-thread',
  FindNotesInTree: 'find-notes-in-tree',
  FindNotesInTrash: 'find-notes-in-trash',
  CreateNoteInThread: 'create-note-in-thread',
  CreateNoteInTree: 'create-note-in-tree',
  EditNote: 'edit-note',
  RemoveNote: 'remove-note',
  RestoreNote: 'restore-note',
  DeleteNote: 'delete-note',
} as const

export type IpcInvokeChannel =
  (typeof _NewIpcChannel)[keyof typeof _NewIpcChannel]

export const IpcInvokeChannel = {
  ..._NewIpcChannel,
  all: Object.values(_NewIpcChannel),
}
