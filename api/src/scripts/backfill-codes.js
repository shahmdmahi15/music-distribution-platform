const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function backfill() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  console.log('Connected to PostgreSQL. Running backfill...');

  const tables = [
    { name: 'PlatformUser', prefix: 'RMIT-PLU-', seq: 'platformuser_code_seq' },
    { name: 'WhiteLabelUser', prefix: 'RMIT-WLU-', seq: 'whitelabeluser_code_seq' },
    { name: 'WhiteLabel', prefix: 'RMIT-WL-', seq: 'whitelabel_code_seq' },
    { name: 'PlatformSubscription', prefix: 'RMIT-SUB-', seq: 'platformsubscription_code_seq' },
    { name: 'PlatformSubscriptionPayment', prefix: 'RMIT-PAY-', seq: 'platformsubscriptionpayment_code_seq' },
    { name: 'Session', prefix: 'RMIT-SES-', seq: 'session_code_seq' },
    { name: 'OAuthAccount', prefix: 'RMIT-OAU-', seq: 'oauthaccount_code_seq' },
    { name: 'WhiteLabelPartner', prefix: 'RMIT-PRT-', seq: 'whitelabelpartner_code_seq' },
  ];

  for (const t of tables) {
    console.log(`Processing table "${t.name}"...`);

    // Create sequence if not exists
    await client.query(`CREATE SEQUENCE IF NOT EXISTS "${t.seq}" START 1;`);

    // Add column code as nullable if not exists
    await client.query(
      `ALTER TABLE "${t.name}" ADD COLUMN IF NOT EXISTS "code" text;`,
    );

    // Fetch rows without code
    const res = await client.query(
      `SELECT "id" FROM "${t.name}" WHERE "code" IS NULL ORDER BY "createdAt" ASC;`,
    );

    for (const row of res.rows) {
      const seqRes = await client.query(`SELECT nextval('${t.seq}') as nextval;`);
      const num = Number(seqRes.rows[0].nextval);
      const code = `${t.prefix}${String(num).padStart(7, '0')}`;

      await client.query(`UPDATE "${t.name}" SET "code" = $1 WHERE "id" = $2;`, [
        code,
        row.id,
      ]);
      console.log(`  Updated ${t.name} ${row.id} -> ${code}`);
    }

    // Alter column to NOT NULL
    await client.query(`ALTER TABLE "${t.name}" ALTER COLUMN "code" SET NOT NULL;`);

    // Add unique constraint / index if not exists
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "${t.name}_code_key" ON "${t.name}"("code");`,
    );
  }

  console.log('Backfill completed successfully!');
  await client.end();
}

backfill().catch((err) => {
  console.error('Error during backfill:', err);
  process.exit(1);
});
