import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

class RollbackError extends Error {
  constructor() {
    super()
  }
}

export function testPrisma(
  name: string,
  testFn: (prisma: PrismaClient) => Promise<void>,
  timeout?: number
) {
  test(
    name,
    async () => {
      try {
        await prisma.$transaction(async (tx: PrismaClient) => {
          await testFn(tx)
          throw new RollbackError()
        })
      } catch (e) {
        if (!(e instanceof RollbackError)) {
          throw e
        }
      }
    },
    timeout
  )
}
