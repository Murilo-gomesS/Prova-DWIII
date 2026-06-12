# Sistema de Reservas de Mesas

Sistema completo para restaurante, com backend em TypeScript + Express, banco MongoDB com Mongoose e frontend estático responsivo consumindo a API localmente em `localhost:3000`.

## Funcionalidades

- Cadastro, edição, listagem e cancelamento de reservas.
- Modelagem com `Mesa` e `Reserva`.
- Seed automático de mesas iniciais na inicialização.
- Regras de negócio:
  - antecedência mínima de 1 hora;
  - duração padrão de 1h30;
  - bloqueio de conflito de horário na mesma mesa;
  - validação de capacidade da mesa;
  - atualização automática do status conforme o horário atual;
  - cancelamento com log.
- Logs de eventos gravados no terminal e em `logs/reservas.log`.
- Frontend com:
  - mapa visual das mesas;
  - modal de detalhes;
  - formulário completo de CRUD;
  - filtros por cliente, mesa, data e status.

## Stack

- Node.js
- TypeScript
- Express
- MongoDB
- Mongoose
- HTML, CSS e JavaScript puro no frontend

## Pré-requisitos

- Node.js 18+ instalado.
- MongoDB rodando localmente ou em um servidor acessível.

## Estrutura do banco

O projeto usa o banco chamado `reserva`.

String de conexão padrão:

```bash
mongodb://127.0.0.1:27017/reserva
```

## Instalação

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

3. Crie o arquivo `.env` na raiz com base em `.env.example`.

Exemplo:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/reserva
NODE_ENV=development
```

## Seed de mesas

O seed é executado automaticamente quando o servidor sobe. Se quiser rodar manualmente:

```bash
npm run seed
```

O seed insere mesas iniciais somente se a coleção estiver vazia.

## Executando o projeto

### Modo desenvolvimento

```bash
npm run dev
```

### Build de produção

```bash
npm run build
npm start
```

Após iniciar, abra:

```bash
http://localhost:3000
```

## Endpoints da API

### Mesas

- `GET /mesas` - Lista as mesas com status atual para o mapa visual.

### Reservas

- `POST /reservas` - Cadastra uma nova reserva.
- `GET /reservas` - Lista reservas com filtros por query string.
- `PUT /reservas/:id` - Atualiza uma reserva existente.
- `DELETE /reservas/:id` - Cancela a reserva.

## Query params de listagem

`GET /reservas` aceita:

- `cliente`
- `mesa`
- `data` no formato `YYYY-MM-DD`
- `status` com um dos valores:
  - `reservado`
  - `ocupado`
  - `finalizado`
  - `cancelado`

Exemplo:

```bash
GET /reservas?cliente=Joao&mesa=3&data=2026-06-12&status=reservado
```

## Regras de negócio implementadas

- A reserva precisa começar pelo menos 1 hora no futuro.
- Cada reserva dura 1h30.
- O sistema bloqueia reservas sobrepostas na mesma mesa.
- A mesa precisa comportar a quantidade de pessoas informada.
- O status é recalculado automaticamente com base no horário atual:
  - `reservado` antes do horário;
  - `ocupado` durante a janela da reserva;
  - `finalizado` após o término;
  - `cancelado` quando removida pelo usuário.

## Frontend

O frontend fica em `public/` e é servido pelo mesmo backend. Ele inclui:

- mapa visual das mesas;
- formulário de reserva;
- tabela de reservas;
- filtros;
- modal de detalhes da mesa.

## Observações

- Se o MongoDB não estiver acessível, o servidor não inicia.
- Os logs são gravados em `logs/reservas.log`.
