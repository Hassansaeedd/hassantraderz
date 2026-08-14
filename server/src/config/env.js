// server/src/config/env.js — Validate required environment variables
export function validateEnv() {
  const required = [
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables:\n   ${missing.join('\n   ')}`);
    console.error('\n👉 Copy server/.env.example to server/.env and fill in the values.\n');
    process.exit(1);
  }

  // Warn about weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    const weakSecrets = [
      'JWT_ACCESS_SECRET',
      'JWT_REFRESH_SECRET',
    ].filter((key) => process.env[key] && process.env[key].length < 32);

    if (weakSecrets.length > 0) {
      console.warn(`⚠️  Weak JWT secrets detected: ${weakSecrets.join(', ')}`);
      console.warn('   Use at least 64 random bytes for production secrets.');
    }
  }
}
