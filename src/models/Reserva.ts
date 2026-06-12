import { Schema, model, type HydratedDocument, type Types } from 'mongoose';

export type ReservationStatus = 'reservado' | 'ocupado' | 'finalizado' | 'cancelado';

export interface IReserva {
  clienteNome: string;
  contatoCliente: string;
  mesa: Types.ObjectId;
  quantidadePessoas: number;
  dataHoraReserva: Date;
  observacoes?: string;
  status: ReservationStatus;
}

export type ReservaDocument = HydratedDocument<IReserva>;

const reservaSchema = new Schema<IReserva>(
  {
    clienteNome: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'O nome do cliente deve ter no mínimo 3 caracteres.'],
      maxlength: [120, 'O nome do cliente deve ter no máximo 120 caracteres.'],
    },
    contatoCliente: {
      type: String,
      required: true,
      trim: true,
      minlength: [8, 'Informe um contato válido.'],
      maxlength: [40, 'O contato deve ter no máximo 40 caracteres.'],
    },
    mesa: {
      type: Schema.Types.ObjectId,
      ref: 'Mesa',
      required: true,
      index: true,
    },
    quantidadePessoas: {
      type: Number,
      required: true,
      min: [1, 'A quantidade de pessoas deve ser no mínimo 1.'],
    },
    dataHoraReserva: {
      type: Date,
      required: true,
      index: true,
    },
    observacoes: {
      type: String,
      trim: true,
      maxlength: [300, 'As observações devem ter no máximo 300 caracteres.'],
      default: '',
    },
    status: {
      type: String,
      enum: ['reservado', 'ocupado', 'finalizado', 'cancelado'],
      default: 'reservado',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

reservaSchema.index({ mesa: 1, dataHoraReserva: 1 }, { unique: true });

export const Reserva = model<IReserva>('Reserva', reservaSchema);
