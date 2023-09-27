export enum IpcChannel {
  PairingRequested = 'pairing-requested',
  BluetoothDeviceFound = 'bluetooth-device-found',
  StateBluetoothScan = 'state-bluetooth-scan',
  StateBluetoothDiscoverable = 'state-bluetooth-discoverable',
  StartBluetoothScan = 'start-bluetooth-scan',
  MakeDiscoverable = 'make-discoverable',
  RequestPairing = 'request-pairing',
  RespondToPairingRequest = 'respond-to-pairing-request',
  GetAllNotes = 'get-all-notes',
}
