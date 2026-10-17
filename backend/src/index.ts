import { createApp } from './app';
import { createAuthService } from './auth/service';
import { loadConfig } from './config';
import { connectDatabase } from './database';

const config = loadConfig();
const { client, db } = await connectDatabase(config);
const auth = await createAuthService(db, config);
const app = createApp(auth, config).listen({ port: config.port, hostname: '127.0.0.1' });
console.log(`Inventory API listening on http://127.0.0.1:${config.port}`);

async function shutdown() {
    await app.stop();
    await client.close();
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
