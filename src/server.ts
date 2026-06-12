import app from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import { seedMesas } from './services/seedService';
import { logEvent } from './utils/logger';

async function startServer(): Promise<void> {
  await connectDatabase();
  await seedMesas();

  app.listen(env.port, () => {
    logEvent(`Servidor iniciado em http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  console.error('Falha ao iniciar o servidor:', error);
  process.exit(1);
});
