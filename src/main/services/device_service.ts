import { Device, PrismaClient } from '@prisma/client'

export class DeviceService {
  private readonly prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * デバイスの情報を探す
   * @param id デバイスの ID (UUID)
   */
  public async find(id: string): Promise<Device | null> {
    throw new Error()
  }

  /**
   * 自身の UUID を取得する
   */
  public async getMyUuid(): Promise<string> {
    throw new Error()
  }

  /**
   * 同期が有効なデバイスをすべて取得する
   */
  public async getAllSyncEnabledDevices(): Promise<Device[]> {
    throw new Error()
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
    throw new Error()
  }

  /**
   * 指定したデバイスとの同期を無効にする
   * @param deviceId 相手デバイスの ID (UUID)
   */
  public async disableSyncWith(deviceId: string): Promise<void> {
    throw new Error()
  }

  /**
   * デバイスとの最終同期時刻を更新する
   * @param device 同期相手のデバイス情報
   * @param syncedAt 最終同期時刻
   */
  public async updateSyncedAt(device: Device, syncedAt: Date): Promise<void> {
    throw new Error()
  }
}
