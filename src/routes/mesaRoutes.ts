import { Router } from 'express';
import { getMesas } from '../controllers/mesaController';

export const mesaRoutes = Router();

mesaRoutes.get('/', getMesas);
