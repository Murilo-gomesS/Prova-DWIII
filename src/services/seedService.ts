import { Mesa } from '../models/Mesa';
import { logEvent } from '../utils/logger';

const defaultTables = [
  { numero: 1, capacidade: 2, localizacao: 'salão' },
  { numero: 2, capacidade: 2, localizacao: 'salão' },
  { numero: 3, capacidade: 4, localizacao: 'varanda' },
  { numero: 4, capacidade: 4, localizacao: 'área interna' },
  { numero: 5, capacidade: 6, localizacao: 'salão' },
  { numero: 6, capacidade: 6, localizacao: 'varanda' },
  { numero: 7, capacidade: 8, localizacao: 'área interna' },
  { numero: 8, capacidade: 8, localizacao: 'salão' },
];

export async function seedMesas(): Promise<void> {
  const existingCount = await Mesa.countDocuments();
  if (existingCount > 0) {
    return;
  }

  await Mesa.insertMany(defaultTables);
  logEvent(`Seed concluído com ${defaultTables.length} mesas iniciais.`);
}
