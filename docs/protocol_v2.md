# Bluenote 同期プロトコル v2

## v1 との違い

データ取得フェーズで、データ要求とデータ受信を並行して行うように変更。
変更に伴って、各リクエストにリクエスト ID を付与するように変更する。

- 現状でも（スレッドの更新リクエスト以外の）リクエストはスレッド、もしくはメモの UUID を送信しているため、リクエストの判別にはこれを使えばいい気がする
- スレッドの更新リクエストは、返却時のリクエスト ID 欄を空文字列にするとかでよさげ

## 改善ポイント

n 個のデータ取得リクエストを送るとし、通信には x 秒の遅延時間がかかるとする (送信して相手に到着するまでにかかる時間が x + データサイズ/帯域幅となると仮定)と、各プロトコルでの処理時間は

- v2

  - (x + リクエストデータサイズ/帯域幅 + DB アクセス時間 + 返却データサイズ/帯域幅 + x) \* n
  - = nx + 総リクエストデータサイズ/帯域幅 + 総 DB アクセス時間 + 総返却データサイズ/帯域幅 + nx

- v3
  - x + 総リクエストデータサイズ/帯域幅 + 総 DB アクセス時間 + 総返却データサイズ/帯域幅 + x
    - 実際は DB アクセスと返却も並行なので、これより短くなるはず

したがって、処理時間が 2(n-1)x + α 短くなると予想される。

## 状態遷移図

```mermaid

---
title: Bluenote Sync Protocol(Client) v2
---

stateDiagram-v2
    state if_version <<choice>>
    state if_permission <<choice>>
    state if_update_success <<choice>>

    [*] --> Connected
    Connected --> VersionWaiting: Sent our protocol version
    VersionWaiting --> if_version: Received their protocol version
    if_version --> [*]: Different
    if_version --> PermissionWaiting: Same, sent our UUID
    PermissionWaiting --> if_permission: Received the permission result
    if_permission --> [*]: Rejected
    if_permission --> DataFetching: Allowed

    state DataFetching {
        state if_sync_finished <<choice>>
        [*] --> DataRequestWaiting
        DataRequestWaiting --> if_sync_finished
        if_sync_finished --> Requested: Request from the client
        Requested --> DataRequestWaiting: Sent a request to the server
        --
        [*] --> DataReceiveWaiting
        DataReceiveWaiting --> Received: Received from the server
        Received --> DataReceiveWaiting: Call back to the client
    }

    if_sync_finished --> UpdatingDB: diff calculation finished
    UpdatingDB --> if_update_success
    if_update_success --> SentingSuccess: Update success
    if_update_success --> SentingFailed: Update failed
    SentingSuccess --> WaitingFinish
    SentingFailed --> WaitingFinish
    WaitingFinish --> [*]: Server disconnected or \ndisconnect from us(when timed out)
```

```mermaid

---
title: Bluenote Sync Protocol(Server) v2
---

stateDiagram-v2
    state if_version <<choice>>
    state if_uuid <<choice>>

    [*] --> Connected
    Connected --> VersionWaiting: Sent our protocol version
    VersionWaiting --> if_version: Received their protocol version
    if_version --> [*]: Different
    if_version --> UUIDWaiting: Same
    UUIDWaiting --> if_uuid: Received the client's uuid
    if_uuid --> [*]: Reject
    if_uuid --> Serve: Allow

    state Serve {
        state client_request <<choice>>
        [*] --> DataRequestWaiting
        DataRequestWaiting --> client_request
        client_request --> DataRequested: Request from the client
        DataRequested --> DataRequestWaiting: Get data from DB\nand send back to the client
    }

    client_request --> SuccessReceived: Received sync success
    client_request --> FailedReceived: Received sync failure

    SuccessReceived --> [*]: Update the sync date and\ndisconnect
    FailedReceived --> [*]: Disconnect
```
