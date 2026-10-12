// Explicit local database selection is required even when server/.env exists.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

async function main() {
  const target = process.argv[2] || 'all';
  if (!['all', 'security', 'reports', 'notifications'].includes(target)) throw new Error('Unknown admin integration suite');
  require('./local-admin-environment.cjs')();
  const env = {
    ...process.env,
    ADMIN_SECURITY_TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
    ADMIN_REPORTS_TEST_DATABASE_URL: process.env.TEST_DATABASE_URL,
  };
  if (target === 'all' || target === 'notifications') {
    // Notification checkout tests exercise the full schema and clean their own fixtures.
    const db = require('../dist/data-source').default;
    await db.initialize();
    try { await db.runMigrations(); } finally { await db.destroy(); }
  }
  const suites = {
    security: ['--test', 'test/admin-security.integration.cjs'],
    reports: ['--test', 'test/admin-reports.integration.cjs'],
    notifications: ['test/admin-notifications.integration.cjs'],
  };
  for (const name of target === 'all' ? Object.keys(suites) : [target]) {
    const result = spawnSync(process.execPath, suites[name], { cwd: path.resolve(__dirname, '..'), env, stdio: 'inherit', windowsHide: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${name} integration exited with status ${result.status}`);
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
