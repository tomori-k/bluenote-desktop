import { execSync } from 'child_process'

process.env.DATABASE_URL = `file:./test-${process.env.JEST_WORKER_ID}.db`

beforeAll(() => {
  execSync('npx prisma migrate reset --force --skip-seed', {
    env: {
      ...process.env,
    },
  })
})
