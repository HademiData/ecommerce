import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import pg from 'pg';

const { Client } = pg;

const USERS = [
  {
    email: 'customer@ratech.com',
    password: 'CustomerPass123!',
    firstName: 'Customer',
    lastName: 'User',
    role: 'customer',
  },
  {
    email: 'admin@ratech.com',
    password: 'AdminPass123!',
    firstName: 'Store',
    lastName: 'Admin',
    role: 'admin',
  },
];

async function readEnvFile() {
  try {
    const file = await readFile(new URL('../.env', import.meta.url), 'utf8');
    const values = {};

    for (const line of file.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
        continue;
      }

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (!match) {
        continue;
      }

      const [, key, rawValue] = match;
      values[key.trim()] = rawValue.trim().replace(/^['"]|['"]$/g, '');
    }

    return values;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

const env = await readEnvFile();
const client = new Client({
  host: process.env.DB_HOST ?? env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME ?? env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? env.DB_NAME ?? 'ecommerce_users',
});

await client.connect();

try {
  for (const user of USERS) {
    const passwordHash = await argon2.hash(user.password);
    const id = randomUUID();

    await client.query(
      `
        INSERT INTO users (
          id,
          email,
          password_hash,
          first_name,
          last_name,
          role,
          email_verified,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          email_verified = EXCLUDED.email_verified,
          updated_at = NOW()
      `,
      [
        id,
        user.email,
        passwordHash,
        user.firstName,
        user.lastName,
        user.role,
      ],
    );

    console.log(`Seeded ${user.role} user: ${user.email}`);
  }
} finally {
  await client.end();
}
