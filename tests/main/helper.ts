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
          await testFn(
            // tx に transaction のダミーを入れておく
            // トランザクションのテストはできないが...。

            new Proxy(tx, {
              get(target, p, receiver) {
                if (p === '$transaction')
                  return async function (
                    fn: (tx: PrismaClient) => Promise<void>
                  ) {
                    await fn(tx)
                  }
                else {
                  return Reflect.get(target, p, receiver)
                }
              },
            })
          )

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
