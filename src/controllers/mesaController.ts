import type { Request, Response, NextFunction } from 'express';
import { listMesasWithStatus } from '../services/reservationService';

export async function getMesas(_request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const mesas = await listMesasWithStatus();
    response.json({
      message: 'Mesas listadas com sucesso.',
      data: mesas,
    });
  } catch (error) {
    next(error);
  }
}
