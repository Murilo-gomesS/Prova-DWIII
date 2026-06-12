import fs from 'fs';
import path from 'path';

const logsDirectory = path.resolve(process.cwd(), 'logs');
const logFilePath = path.join(logsDirectory, 'reservas.log');

function ensureLogsDirectory(): void {
  if (!fs.existsSync(logsDirectory)) {
    fs.mkdirSync(logsDirectory, { recursive: true });
  }
}

export function logEvent(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  ensureLogsDirectory();
  fs.appendFileSync(logFilePath, `${line}\n`, 'utf8');
}
