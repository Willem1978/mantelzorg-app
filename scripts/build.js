const { execSync } = require('child_process');

// If DIRECT_URL is not set, derive it from DATABASE_URL
// Supabase pooler uses port 6543 (transaction mode), direct connection uses port 5432
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL
    .replace(':6543/', ':5432/')
    .replace('&pgbouncer=true', '')
    .replace('?pgbouncer=true&', '?')
    .replace('?pgbouncer=true', '');
  console.log('DIRECT_URL automatically set from DATABASE_URL (direct connection on port 5432)');
}

execSync('prisma generate && prisma db push --skip-generate --accept-data-loss && next build', {
  stdio: 'inherit',
  env: process.env,
});
