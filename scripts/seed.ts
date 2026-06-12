import { connectDatabase } from '../src/config/db';
import { seedMesas } from '../src/services/seedService';

async function runSeed(): Promise<void> {
  await connectDatabase();
  await seedMesas();
  console.log('Seed executado com sucesso.');
  process.exit(0);
}

runSeed().catch((error) => {
  console.error('Falha ao executar seed:', error);
  process.exit(1);
});
