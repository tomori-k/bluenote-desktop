import { testPrisma } from './helper'
import { DeviceService } from '../../src/main/services/device_service'

describe('find', () => {
  testPrisma('exist', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    await expect(deviceService.find('a')).resolves.toStrictEqual({
      id: 'a',
      name: '',
      me: false,
      syncedAt: new Date('2023-11-22T10:54:49Z'),
      syncEnabled: false,
    })
  })

  testPrisma('not exist', async (prisma) => {
    const deviceService = new DeviceService(prisma)

    await expect(deviceService.find('a')).resolves.toBe(null)
  })
})

describe('getMyUuid', () => {
  testPrisma('create new', async (prisma) => {
    const deviceService = new DeviceService(prisma)

    const myUuid = await deviceService.getMyUuid()
    const created = await prisma.device.findFirst()

    expect(created).toStrictEqual({
      id: myUuid,
      name: '',
      me: true,
      syncEnabled: false,
      syncedAt: new Date(0),
    })
    expect(myUuid).toMatch(/^[A-z0-9]{8}(-[A-z0-9]{4}){3}-[A-z0-9]{12}$/)
  })

  testPrisma('get created id', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          me: true,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
        {
          id: 'b',
          name: '',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    expect(await deviceService.getMyUuid()).toBe('a')
  })

  testPrisma('use cache after first get', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          me: true,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
        {
          id: 'b',
          name: '',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    expect(await deviceService.getMyUuid()).toBe('a')

    await prisma.device.delete({ where: { id: 'a' } })

    expect(await deviceService.getMyUuid()).toBe('a')
  })
})

describe('getAllSyncEnabledDevices', () => {
  testPrisma('ok', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: '',
          me: true,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
        {
          id: 'b',
          name: '',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: true,
        },
        {
          id: 'c',
          name: '',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:50Z'),
          syncEnabled: true,
        },
        {
          id: 'd',
          name: '',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:50Z'),
          syncEnabled: false,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    expect(await deviceService.getAllSyncEnabledDevices()).toStrictEqual([
      {
        id: 'c',
        name: '',
        me: false,
        syncedAt: new Date('2023-11-22T10:54:50Z'),
        syncEnabled: true,
      },
      {
        id: 'b',
        name: '',
        me: false,
        syncedAt: new Date('2023-11-22T10:54:49Z'),
        syncEnabled: true,
      },
    ])
  })
})

describe('enableSyncWith', () => {
  testPrisma('unregistered', async (prisma) => {
    const deviceService = new DeviceService(prisma)

    await deviceService.enableSyncWith('a', 'あいうえお')

    expect(await prisma.device.findFirst()).toStrictEqual({
      id: 'a',
      name: 'あいうえお',
      me: false,
      syncedAt: new Date(0),
      syncEnabled: true,
    })
  })

  testPrisma('registered', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: 'あいうえお',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: false,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    await deviceService.enableSyncWith('a', 'k')

    expect(await prisma.device.findFirst()).toStrictEqual({
      id: 'a',
      name: 'k',
      me: false,
      syncedAt: new Date('2023-11-22T10:54:49Z'),
      syncEnabled: true,
    })
  })
})

describe('disableSyncWith', () => {
  testPrisma('exist', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: 'あいうえお',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: true,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    await deviceService.disableSyncWith('a')

    expect(await prisma.device.findFirst()).toStrictEqual({
      id: 'a',
      name: 'あいうえお',
      me: false,
      syncedAt: new Date('2023-11-22T10:54:49Z'),
      syncEnabled: false,
    })
  })

  testPrisma('not exist', async (prisma) => {
    const deviceService = new DeviceService(prisma)

    await deviceService.disableSyncWith('a')

    expect(await prisma.device.findFirst()).toStrictEqual(null)
  })
})

describe('updateSyncedAt', () => {
  testPrisma('exist', async (prisma) => {
    await Promise.all(
      [
        {
          id: 'a',
          name: 'あいうえお',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: true,
        },
      ].map((x) => prisma.device.create({ data: x }))
    )

    const deviceService = new DeviceService(prisma)

    await deviceService.updateSyncedAt(
      {
        id: 'a',
        name: 'あいうえお',
        me: false,
        syncedAt: new Date('2023-11-22T10:54:49Z'),
        syncEnabled: true,
      },
      new Date('2023-11-22T10:54:50Z')
    )

    expect(await prisma.device.findFirst()).toStrictEqual({
      id: 'a',
      name: 'あいうえお',
      me: false,
      syncedAt: new Date('2023-11-22T10:54:50Z'),
      syncEnabled: true,
    })
  })

  testPrisma('not exist', async (prisma) => {
    const deviceService = new DeviceService(prisma)

    await expect(
      deviceService.updateSyncedAt(
        {
          id: 'a',
          name: 'あいうえお',
          me: false,
          syncedAt: new Date('2023-11-22T10:54:49Z'),
          syncEnabled: true,
        },
        new Date('2023-11-22T10:54:50Z')
      )
    ).rejects.toThrow(Error)
  })
})
