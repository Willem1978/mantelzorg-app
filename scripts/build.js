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
execSync('prisma generate', { stdio: 'inherit', env: process.env });

// Only run db push if not on Vercel (migrations should be managed separately)
if (!process.env.VERCEL) {
  execSync('prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit', env: process.env });
} else {
  console.log('Skipping prisma db push on Vercel (manage migrations separately)');
}

// Build Next.js
execSync('next build', { stdio: 'inherit', env: process.env });
