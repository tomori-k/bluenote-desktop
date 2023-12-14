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

/**
 * 日付が指定した日時以降であるかをテスト
 * @param actual チェック対象の日時
 * @param value 基準
 */
export function assertDateGreaterThanOrEqual(actual: Date, value: Date) {
  expect(actual.getTime()).toBeGreaterThanOrEqual(value.getTime())
}
