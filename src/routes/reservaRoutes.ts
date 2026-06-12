import { Router } from 'express';
import { deleteReserva, getReservas, postReserva, putReserva } from '../controllers/reservaController';

export const reservaRoutes = Router();

reservaRoutes.get('/', getReservas);
reservaRoutes.post('/', postReserva);
reservaRoutes.put('/:id', putReserva);
reservaRoutes.delete('/:id', deleteReserva);
