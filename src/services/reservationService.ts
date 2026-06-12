import { Mesa, type IMesa } from '../models/Mesa';
import { Reserva, type IReserva, type ReservationStatus } from '../models/Reserva';
import { HttpError } from '../utils/httpError';
import {
  MINIMUM_ADVANCE_MINUTES,
  RESERVATION_DURATION_MINUTES,
  addMinutes,
  endOfDay,
  startOfDay,
} from '../utils/dates';
import { logEvent } from '../utils/logger';
import { Types } from 'mongoose';

type MesaWithId = IMesa & { _id: Types.ObjectId };

export interface ReservationInput {
  clienteNome: string;
  contatoCliente: string;
  mesaNumero?: number;
  mesaId?: string;
  quantidadePessoas: number;
  dataHoraReserva: string;
  observacoes?: string;
}

export interface ReservationUpdateInput extends Partial<ReservationInput> {
  mesaNumero?: number;
  mesaId?: string;
}

export interface ReservationFilters {
  cliente?: string;
  mesa?: string;
  data?: string;
  status?: ReservationStatus;
}

export interface MesaSummary extends IMesa {
  _id: Types.ObjectId;
  statusAtual: 'disponivel' | 'reservado' | 'ocupado';
  proximaReserva?: {
    id: string;
    clienteNome: string;
    dataHoraReserva: Date;
    status: ReservationStatus;
  };
}

function parseDateOrThrow(value: string, message = 'Data e hora da reserva inválida.'): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, message);
  }
  return parsed;
}

function normalizeText(value: string): string {
  return value.trim();
}

function computeStatus(dataHoraReserva: Date, now = new Date()): ReservationStatus {
  const end = addMinutes(dataHoraReserva, RESERVATION_DURATION_MINUTES);

  if (now.getTime() < dataHoraReserva.getTime()) {
    return 'reservado';
  }

  if (now.getTime() >= dataHoraReserva.getTime() && now.getTime() < end.getTime()) {
    return 'ocupado';
  }

  return 'finalizado';
}

async function resolveMesa(payload: { mesaNumero?: number; mesaId?: string }): Promise<MesaWithId> {
  if (payload.mesaId) {
    const mesaById = await Mesa.findById(payload.mesaId);
    if (!mesaById) {
      throw new HttpError(404, 'Mesa não encontrada.');
    }
    return mesaById as MesaWithId;
  }

  if (typeof payload.mesaNumero === 'number') {
    const mesaByNumber = await Mesa.findOne({ numero: payload.mesaNumero });
    if (!mesaByNumber) {
      throw new HttpError(404, 'Mesa não encontrada.');
    }
    return mesaByNumber as MesaWithId;
  }

  throw new HttpError(400, 'Informe o número da mesa ou o ID da mesa.');
}

async function ensureBusinessRules(
  input: ReservationInput | ReservationUpdateInput,
  reservationId?: string,
): Promise<{ mesa: MesaWithId; dataHoraReserva: Date }> {
  if (!input.clienteNome || !input.contatoCliente) {
    throw new HttpError(400, 'Nome e contato do cliente são obrigatórios.');
  }

  if (typeof input.quantidadePessoas !== 'number' || Number.isNaN(input.quantidadePessoas)) {
    throw new HttpError(400, 'Informe a quantidade de pessoas.');
  }

  const dataHoraReserva = parseDateOrThrow(String(input.dataHoraReserva));
  const mesa = await resolveMesa({ mesaId: input.mesaId, mesaNumero: input.mesaNumero });
  const now = new Date();
  const minimumDate = addMinutes(now, MINIMUM_ADVANCE_MINUTES);

  if (dataHoraReserva.getTime() < minimumDate.getTime()) {
    throw new HttpError(400, 'A reserva deve ser criada com antecedência mínima de 1 hora.');
  }

  if (mesa.capacidade < input.quantidadePessoas) {
    throw new HttpError(400, 'A capacidade da mesa é insuficiente para a quantidade de pessoas informada.');
  }

  const reservationEnd = addMinutes(dataHoraReserva, RESERVATION_DURATION_MINUTES);
  const overlapQuery: Record<string, unknown> = {
    mesa: mesa._id,
    status: { $ne: 'cancelado' },
    dataHoraReserva: { $lt: reservationEnd, $gte: addMinutes(dataHoraReserva, -RESERVATION_DURATION_MINUTES) },
  };

  if (reservationId) {
    overlapQuery._id = { $ne: reservationId };
  }

  const conflictingReservations = await Reserva.find(overlapQuery).lean();

  const hasConflict = conflictingReservations.some((reservation) => {
    const existingStart = new Date(reservation.dataHoraReserva);
    const existingEnd = addMinutes(existingStart, RESERVATION_DURATION_MINUTES);
    return dataHoraReserva.getTime() < existingEnd.getTime() && existingStart.getTime() < reservationEnd.getTime();
  });

  if (hasConflict) {
    throw new HttpError(409, 'Já existe uma reserva para esta mesa nesse horário.');
  }

  return { mesa, dataHoraReserva };
}

export async function createReservation(input: ReservationInput) {
  const normalized = {
    clienteNome: normalizeText(input.clienteNome),
    contatoCliente: normalizeText(input.contatoCliente),
    quantidadePessoas: Number(input.quantidadePessoas),
    dataHoraReserva: input.dataHoraReserva,
    observacoes: input.observacoes?.trim() ?? '',
    mesaNumero: input.mesaNumero,
    mesaId: input.mesaId,
  };

  const { mesa, dataHoraReserva } = await ensureBusinessRules(normalized);

  const reservation = await Reserva.create({
    clienteNome: normalized.clienteNome,
    contatoCliente: normalized.contatoCliente,
    mesa: mesa._id,
    quantidadePessoas: normalized.quantidadePessoas,
    dataHoraReserva,
    observacoes: normalized.observacoes,
    status: 'reservado',
  });

  logEvent(`Reserva criada: mesa ${mesa.numero} para ${normalized.clienteNome} em ${dataHoraReserva.toISOString()}`);

  return reservation.populate('mesa');
}

export async function updateReservation(reservationId: string, input: ReservationUpdateInput) {
  const currentReservation = await Reserva.findById(reservationId);
  if (!currentReservation) {
    throw new HttpError(404, 'Reserva não encontrada.');
  }

  if (currentReservation.status === 'cancelado') {
    throw new HttpError(400, 'Não é possível editar uma reserva cancelada.');
  }

  if (currentReservation.status === 'finalizado') {
    throw new HttpError(400, 'Não é possível editar uma reserva finalizada.');
  }

  const mergedInput: ReservationInput = {
    clienteNome: input.clienteNome ?? currentReservation.clienteNome,
    contatoCliente: input.contatoCliente ?? currentReservation.contatoCliente,
    quantidadePessoas: input.quantidadePessoas ?? currentReservation.quantidadePessoas,
    dataHoraReserva: input.dataHoraReserva ?? currentReservation.dataHoraReserva.toISOString(),
    observacoes: input.observacoes ?? currentReservation.observacoes,
    mesaId: input.mesaId,
    mesaNumero: input.mesaNumero,
  };

  const { mesa, dataHoraReserva } = await ensureBusinessRules(mergedInput, reservationId);

  currentReservation.clienteNome = normalizeText(mergedInput.clienteNome);
  currentReservation.contatoCliente = normalizeText(mergedInput.contatoCliente);
  currentReservation.quantidadePessoas = Number(mergedInput.quantidadePessoas);
  currentReservation.dataHoraReserva = dataHoraReserva;
  currentReservation.observacoes = mergedInput.observacoes?.trim() ?? '';
  currentReservation.mesa = mesa._id;
  currentReservation.status = computeStatus(currentReservation.dataHoraReserva);

  await currentReservation.save();
  logEvent(`Reserva atualizada: ${reservationId} para mesa ${mesa.numero}`);

  return currentReservation.populate('mesa');
}

export async function cancelReservation(reservationId: string) {
  const reservation = await Reserva.findById(reservationId);
  if (!reservation) {
    throw new HttpError(404, 'Reserva não encontrada.');
  }

  reservation.status = 'cancelado';
  await reservation.save();
  logEvent(`Reserva cancelada: ${reservationId}`);

  return reservation.populate('mesa');
}

export async function listReservations(filters: ReservationFilters) {
  const query: Record<string, unknown> = {};

  if (filters.cliente) {
    query.clienteNome = { $regex: filters.cliente, $options: 'i' };
  }

  if (filters.mesa) {
    if (Types.ObjectId.isValid(filters.mesa)) {
      query.mesa = filters.mesa;
    } else {
      const mesa = await Mesa.findOne({ numero: Number(filters.mesa) });
      if (mesa) {
        query.mesa = mesa._id;
      } else {
        query.mesa = null;
      }
    }
  }

  if (filters.data) {
    const parsedDate = parseDateOrThrow(filters.data, 'Data do filtro inválida.');
    query.dataHoraReserva = { $gte: startOfDay(parsedDate), $lte: endOfDay(parsedDate) };
  }

  const reservations = await Reserva.find(query).populate('mesa').sort({ dataHoraReserva: 1 });
  const now = new Date();
  const changedReservations: Array<IReserva & { _id: Types.ObjectId }> = [];

  for (const reservation of reservations) {
    const computedStatus = reservation.status === 'cancelado' ? 'cancelado' : computeStatus(reservation.dataHoraReserva, now);
    if (reservation.status !== computedStatus) {
      reservation.status = computedStatus;
      await reservation.save();
      changedReservations.push(reservation as IReserva & { _id: Types.ObjectId });
    } else {
      reservation.status = computedStatus;
    }
  }

  const filteredReservations = filters.status
    ? reservations.filter((reservation) => reservation.status === filters.status)
    : reservations;

  return { reservations: filteredReservations, changedReservations };
}

export async function listMesasWithStatus(): Promise<MesaSummary[]> {
  const mesas = (await Mesa.find().sort({ numero: 1 }).lean()) as Array<MesaWithId>;
  const reservations = await Reserva.find({ status: { $ne: 'cancelado' } }).sort({ dataHoraReserva: 1 }).lean();
  const now = new Date();

  return mesas.map((mesa): MesaSummary => {
    const mesaReservations = reservations
      .filter((reservation) => reservation.mesa.toString() === mesa._id.toString())
      .map((reservation) => ({
        id: reservation._id.toString(),
        clienteNome: reservation.clienteNome,
        dataHoraReserva: new Date(reservation.dataHoraReserva),
        status: reservation.status,
      }))
      .sort((left, right) => left.dataHoraReserva.getTime() - right.dataHoraReserva.getTime());

    const currentReservation = mesaReservations.find((reservation) => {
      const start = reservation.dataHoraReserva.getTime();
      const end = addMinutes(reservation.dataHoraReserva, RESERVATION_DURATION_MINUTES).getTime();
      return now.getTime() >= start && now.getTime() < end;
    });

    const nextReservation = mesaReservations.find((reservation) => reservation.dataHoraReserva.getTime() > now.getTime());

    return {
      ...mesa,
      statusAtual: currentReservation ? 'ocupado' : nextReservation ? 'reservado' : 'disponivel',
      proximaReserva: nextReservation,
    };
  });
}

export function normalizeReservationStatus(reservation: { dataHoraReserva: Date; status: ReservationStatus }, now = new Date()): ReservationStatus {
  if (reservation.status === 'cancelado') {
    return 'cancelado';
  }

  return computeStatus(reservation.dataHoraReserva, now);
}
