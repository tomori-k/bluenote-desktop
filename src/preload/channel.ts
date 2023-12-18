export enum IpcChannel {
  BondRequested = 'bond-requested',
  BluetoothDeviceFound = 'bluetooth-device-found',
  StateBluetoothScan = 'state-bluetooth-scan',
  StateSyncRequestListen = 'state-sync-request-listen',
  StartBluetoothScan = 'start-bluetooth-scan',
  RequestSync = 'request-sync',
  RespondToBondRequest = 'respond-to-bond-request',
  ListenSyncRequest = 'listen-sync-request',
  DisableSync = 'disable-sync',
  GetSyncDevices = 'get-sync-devices',

  GetAllThreads = 'get-all-threads',
  CreateThread = 'create-thread',
  RenameThread = 'rename-thread',
  ChangeDisplayMode = 'change-display-mode',
  RemoveThread = 'remove-thread',

  FindNotesInThread = 'find-notes-in-thread',
  FindNotesInTree = 'find-notes-in-tree',
  FindNotesInTrash = 'find-notes-in-trash',
  CreateNoteInThread = 'create-note-in-thread',
  CreateNoteInTree = 'create-note-in-tree',
  EditNote = 'edit-note',
  RemoveNote = 'remove-note',
  RestoreNote = 'restore-note',
  DeleteNote = 'delete-note',
}

const _NewIpcChannel = {
  StartBluetoothScan: 'start-bluetooth-scan',
  StopBluetoothScan: 'stop-bluetooth-scan',
} as const

export type NewIpcChannel = (typeof _NewIpcChannel)[keyof typeof _NewIpcChannel]

export const NewIpcChannel = {
  ..._NewIpcChannel,
  all: Object.values(_NewIpcChannel),
}
