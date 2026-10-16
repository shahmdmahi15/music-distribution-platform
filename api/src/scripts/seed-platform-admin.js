#!/usr/bin/env node
/**
 * RoyalMotionIT Platform Admin Seeder
 * Creates or updates the primary Owner / Super-Admin user in PostgreSQL.
 *
 * Usage:
 *   node seed-platform-admin.js --email="admin@royalmotionit.com" --password="StrongPassword123!" --firstName="Platform" --lastName="Admin"
 */
const { Client } = require('pg');
const argon2 = require('argon2');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
};

function getArg(flag, defaultValue = null) {
  const match = process.argv.find((arg) => arg.startsWith(`--${flag}=`));
  if (match) return match.split('=')[1];
  const idx = process.argv.indexOf(`--${flag}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return defaultValue;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not configured in .env');
    process.exit(1);
  }

  const email = (getArg('email') || process.env.ADMIN_EMAIL || 'admin@royalmotionit.com').trim().toLowerCase();
  const password = getArg('password') || process.env.ADMIN_PASSWORD || 'RoyalMotionIT@2026Admin!';
  const firstName = getArg('firstName') || 'Platform';
  const lastName = getArg('lastName') || 'Owner';
  const role = (getArg('role') || 'OWNER').toUpperCase();

  console.log('👑 [Platform Admin Seed] Initializing administrator account provisioner...');
  console.log(`📧 Target Email:  ${email}`);
  console.log(`👤 Name:          ${firstName} ${lastName}`);
  console.log(`🛡️ Role:          ${role}`);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    // 1. Ensure platformuser_code_seq exists
    await client.query(`CREATE SEQUENCE IF NOT EXISTS "platformuser_code_seq" START 1;`);

    // 2. Hash password with OWASP Argon2id profile
    console.log('🔒 Hashing password with Argon2id...');
    const passwordHash = await argon2.hash(password, ARGON2_CONFIG);

    // 3. Check if user already exists
    const existing = await client.query(
      `SELECT "id", "email", "role", "code" FROM "PlatformUser" WHERE "email" = $1 LIMIT 1;`,
      [email]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];
      console.log(`ℹ️ User ${email} already exists with Code: ${user.code}. Updating credentials and verifying...`);
      await client.query(
        `UPDATE "PlatformUser" 
         SET "passwordHash" = $1, "role" = $2, "emailVerified" = true, "firstName" = $3, "lastName" = $4, "updatedAt" = NOW()
         WHERE "id" = $5;`,
        [passwordHash, role, firstName, lastName, user.id]
      );
      console.log(`✅ Platform user ${email} successfully upgraded to ${role}!`);
    } else {
      // 4. Generate user code
      const seqRes = await client.query(`SELECT nextval('platformuser_code_seq') as nextval;`);
      const nextNum = Number(seqRes.rows[0].nextval);
      const code = `RMIT-PLU-${String(nextNum).padStart(7, '0')}`;
      const id = 'usr_' + crypto.randomBytes(12).toString('hex');

      console.log(`✨ Creating new ${role} account with Code: ${code}...`);
      await client.query(
        `INSERT INTO "PlatformUser" (
          "id", "code", "firstName", "lastName", "email", "passwordHash", 
          "emailVerified", "twoFactorEnabled", "role", "failedLoginAttempts",
          "failedVerificationAttempts", "failedPasswordResetAttempts", "failedTwoFactorAttempts",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 
          true, false, $7, 0, 
          0, 0, 0, 
          NOW(), NOW()
        );`,
        [id, code, firstName, lastName, email, passwordHash, role]
      );
      console.log(`🎉 Platform Administrator created successfully!`);
    }

    console.log('==========================================================');
    console.log('  Login URL:  https://platform.royalmotionit.com/auth/login');
    console.log(`  Username:   ${email}`);
    console.log(`  Password:   ${password}`);
    console.log('==========================================================');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌ Failed to seed platform admin:', err);
  process.exit(1);
});
