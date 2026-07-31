import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type postgres from 'postgres'
import { env } from '../env.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function migrate(sql: postgres.Sql) {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  await sql.unsafe(schema)
}

/** CLI : npm run db:migrate -w @leafitome/api */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { default: postgresClient } = await import('postgres')
  const sql = postgresClient(env.DATABASE_URL)
  try {
    await migrate(sql)
    console.log('Migrations OK')
  } finally {
    await sql.end()
  }
}
