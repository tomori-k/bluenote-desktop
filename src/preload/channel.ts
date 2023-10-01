export enum IpcChannel {
  PairingRequested = 'pairing-requested',
  BluetoothDeviceFound = 'bluetooth-device-found',
  StateBluetoothScan = 'state-bluetooth-scan',
  StateBluetoothDiscoverable = 'state-bluetooth-discoverable',
  StartBluetoothScan = 'start-bluetooth-scan',
  MakeDiscoverable = 'make-discoverable',
  RequestPairing = 'request-pairing',
  RespondToPairingRequest = 'respond-to-pairing-request',
  Create = 'create',
  Sync = 'sync',

  GetAllThreads = 'get-all-threads',
  CreateThread = 'create-thread',
  UpdateThread = 'update-thread',
  DeleteThread = 'delete-thread',

  GetAllNotes = 'get-all-notes',
  GetNotes = 'get-notes',
  GetTree = 'get-Tree',
  CreateNote = 'create-note',
  UpdateNote = 'update-note',
  DeleteNote = 'delete-note',
}
