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

// Generate Prisma client
execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

// Run db push to ensure database schema is up to date
// This may fail if the direct database connection (port 5432) is unreachable from
// the build environment (common with Supabase). Schema should be managed locally.
try {
  execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit', env: process.env });
} catch (e) {
  console.warn('Warning: prisma db push failed (direct DB connection may be unreachable from build server).');
  console.warn('Ensure schema is up to date by running "npx prisma db push" locally.');
}

// Build Next.js
execSync('npx next build', { stdio: 'inherit', env: process.env });
