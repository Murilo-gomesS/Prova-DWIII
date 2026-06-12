import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/httpError';

export function notFoundHandler(_request: Request, response: Response): void {
  response.status(404).json({
    message: 'Rota não encontrada.',
  });
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction): void {
  if (error instanceof HttpError) {
    response.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    message: 'Erro interno do servidor.',
  });
}
