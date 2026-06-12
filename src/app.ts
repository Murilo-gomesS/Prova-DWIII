import express from 'express';
import cors from 'cors';
import path from 'path';
import { reservaRoutes } from './routes/reservaRoutes';
import { mesaRoutes } from './routes/mesaRoutes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();
const publicDirectory = path.resolve(process.cwd(), 'public');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(publicDirectory));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/reservas', reservaRoutes);
app.use('/mesas', mesaRoutes);

app.get('/', (_request, response) => {
  response.sendFile(path.join(publicDirectory, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
