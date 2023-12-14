import { Device, PrismaClient } from '@prisma/client'

export class DeviceService {
  private readonly prisma: PrismaClient
  private myUuid: string | null

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
    this.myUuid = null
  }

  /**
   * デバイスの情報を探す
   * @param id デバイスの ID (UUID)
   */
  public async find(id: string): Promise<Device | null> {
    return await this.prisma.device.findUnique({ where: { id: id } })
  }

  /**
   * 自身の UUID を取得する
   */
  public async getMyUuid(): Promise<string> {
    if (this.myUuid == null) {
      let me = await this.prisma.device.findFirst({ where: { me: true } })

      if (me == null) {
        me = await this.prisma.device.create({
          data: {
            name: '',
            me: true,
            syncEnabled: false,
            syncedAt: new Date(0),
          },
        })
      }

      this.myUuid = me.id
    }

    return this.myUuid
  }

  /**
   * 同期が有効なデバイスをすべて取得する
   * 最終同期時刻で降順にソート
   */
  public async getAllSyncEnabledDevices(): Promise<Device[]> {
    return await this.prisma.device.findMany({
      where: { me: false, syncEnabled: true },
      orderBy: {
        syncedAt: 'desc',
      },
    })
  }

  /**
   * 指定したデバイスとの同期を有効にする
   * @param deviceId 相手デバイスの ID (UUID)
   * @param deviceName 相手デバイスの名前
   */
  public async enableSyncWith(
    deviceId: string,
    deviceName: string
  ): Promise<void> {
    const registered = await this.find(deviceId)

    if (registered == null) {
      await this.prisma.device.create({
        data: {
          id: deviceId,
          name: deviceName,
          me: false,
          syncedAt: new Date(0),
          syncEnabled: true,
        },
      })
    } else {
      await this.prisma.device.update({
        where: {
          id: deviceId,
        },
        data: {
          name: deviceName,
          syncEnabled: true,
        },
      })
    }
  }

  /**
   * 指定したデバイスとの同期を無効にする
   * @param deviceId 相手デバイスの ID (UUID)
   */
  public async disableSyncWith(deviceId: string): Promise<void> {
    await this.prisma.device.updateMany({
      where: { id: deviceId },
      data: { syncEnabled: false },
    })
  }

  /**
   * デバイスとの最終同期時刻を更新する
   * @param device 同期相手のデバイス情報
   * @param syncedAt 最終同期時刻
   */
  public async updateSyncedAt(device: Device, syncedAt: Date): Promise<void> {
    await this.prisma.device.update({
      where: { id: device.id },
      data: { syncedAt: syncedAt },
    })
  }
}
