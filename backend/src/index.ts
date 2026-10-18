import { createApp } from './app';
import { createAuthService, createInventoryService } from './composition';
import { loadConfig } from './config';
import { connectDatabase } from './database';

const config = loadConfig();
const { client, db } = await connectDatabase(config);
const auth = await createAuthService(db, config);
const inventory = createInventoryService(db, client);
const app = createApp(auth, config, undefined, inventory).listen({
    port: config.port,
    hostname: '127.0.0.1',
});
console.log(`Inventory API listening on http://127.0.0.1:${config.port}`);

async function shutdown() {
    await app.stop();
    await client.close();
    process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
