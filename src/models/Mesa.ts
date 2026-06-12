import { Schema, model, type HydratedDocument } from 'mongoose';

export interface IMesa {
  numero: number;
  capacidade: number;
  localizacao: string;
}

export type MesaDocument = HydratedDocument<IMesa>;

const mesaSchema = new Schema<IMesa>(
  {
    numero: {
      type: Number,
      required: true,
      unique: true,
      min: [1, 'O número da mesa deve ser maior que zero.'],
      index: true,
    },
    capacidade: {
      type: Number,
      required: true,
      min: [1, 'A capacidade deve ser de pelo menos 1 pessoa.'],
    },
    localizacao: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, 'Informe a localização da mesa.'],
      maxlength: [60, 'A localização deve ter no máximo 60 caracteres.'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Mesa = model<IMesa>('Mesa', mesaSchema);
