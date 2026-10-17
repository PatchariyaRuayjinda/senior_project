import { fileURLToPath } from 'node:url';

export async function runMigrationCommand(uri: string, database: string, action: string) {
    // No --env-file: tests always override the target and never load the user's Atlas credentials.
    const child = Bun.spawn(['node', fileURLToPath(new URL('../../scripts/migrate.js', import.meta.url)), action], {
        env: { ...process.env, MONGODB_URI: uri, MONGODB_DATABASE: database },
        stdout: 'pipe', stderr: 'pipe',
    });
    const [exitCode, stdout, stderr] = await Promise.all([
        child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
    ]);
    return { exitCode, stdout, stderr };
}

export async function migrateTestDatabase(uri: string, database: string) {
    const result = await runMigrationCommand(uri, database, 'up');
    if (result.exitCode !== 0) throw new Error(`Test database migration failed: ${result.stderr}`);
}
