"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/config/db");
const seedService_1 = require("../src/services/seedService");
async function runSeed() {
    await (0, db_1.connectDatabase)();
    await (0, seedService_1.seedMesas)();
    console.log('Seed executado com sucesso.');
    process.exit(0);
}
runSeed().catch((error) => {
    console.error('Falha ao executar seed:', error);
    process.exit(1);
});
