import type { Request, Response, NextFunction } from 'express';
import {
  cancelReservation,
  createReservation,
  listReservations,
  updateReservation,
} from '../services/reservationService';

export async function postReserva(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const reservation = await createReservation(request.body);
    response.status(201).json({
      message: 'Reserva criada com sucesso.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReservas(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const { cliente, mesa, data, status } = request.query;
    const result = await listReservations({
      cliente: typeof cliente === 'string' ? cliente : undefined,
      mesa: typeof mesa === 'string' ? mesa : undefined,
      data: typeof data === 'string' ? data : undefined,
      status: typeof status === 'string' ? (status as 'reservado' | 'ocupado' | 'finalizado' | 'cancelado') : undefined,
    });

    response.json({
      message: 'Reservas listadas com sucesso.',
      data: result.reservations,
    });
  } catch (error) {
    next(error);
  }
}

export async function putReserva(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const reservationId = String(request.params.id);
    const reservation = await updateReservation(reservationId, request.body);
    response.json({
      message: 'Reserva atualizada com sucesso.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReserva(request: Request, response: Response, next: NextFunction): Promise<void> {
  try {
    const reservationId = String(request.params.id);
    const reservation = await cancelReservation(reservationId);
    response.json({
      message: 'Reserva cancelada com sucesso.',
      data: reservation,
    });
  } catch (error) {
    next(error);
  }
}
