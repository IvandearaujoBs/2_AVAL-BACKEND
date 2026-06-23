# Aval-02 Institutional Trip Requests API

## Team

Team name: Aval-02

Members:

- Ivanildo dos Santos Araujo


## Description

REST API for simplified institutional trip request management. The API creates, lists, retrieves and cancels trip requests, validates business rules, persists data in PostgreSQL and checks Brazilian national holidays through BrasilAPI.

## Technologies

- Node.js 20+
- TypeScript with `strict: true`
- Express
- PostgreSQL
- Docker Compose
- Vitest
- Supertest
- Native `fetch`

## Package Manager

This project uses `npm`.

## Database

The chosen DBMS is PostgreSQL, executed through Docker Compose.

## Environment

The application uses the following variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://trip_user:trip_password@localhost:5432/trip_requests
HOLIDAYS_API_BASE_URL=https://brasilapi.com.br
```

The project has functional defaults equal to `.env.example`, so it can run even when `.env` does not exist. To create a local `.env` file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Installation

```bash
npm install
```

## Start The Database

```bash
docker compose up -d
```

### Windows Docker Setup

If `docker` is not recognized on Windows, install Docker Desktop and enable the required WSL features. Open PowerShell as Administrator and run:

```powershell
wsl --install --no-distribution
```

Restart Windows, install Docker Desktop, open it once and wait until it shows that Docker is running. Then verify:

```powershell
docker --version
docker compose version
```

If WSL2 still reports that virtualization is unavailable, enable virtualization in BIOS/UEFI, usually named Intel VT-x, Intel Virtualization Technology, AMD-V or SVM.

## Initialize And Seed The Database

The `init:db` script creates the required table and inserts 10 trip requests. It can be executed multiple times.

```bash
npm run init:db
```

This script does not seed or mirror national holidays.

## Run The Application

Development mode:

```bash
npm run dev
```

Production build:

```bash
npm run build
npm start
```

The API runs on `http://localhost:3000`.

## Run Tests

```bash
npm test
```

The tests use fake dependencies for holidays and persistence, so they do not depend on the real BrasilAPI or Docker.

## Local Execution Sequence

```bash
npm install
cp .env.example .env
docker compose up -d
npm run init:db
npm run dev
```

## Response Format

Success:

```json
{
  "success": true,
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "A clear and objective error message"
  }
}
```

## Endpoints

### `GET /health`

Checks whether the API is running.

### `POST /trip-requests`

Creates a new trip request with initial status `pending`. The API validates required fields, normalizes dates to UTC ISO 8601 and rejects trips that start on a Brazilian national holiday.

Request body:

```json
{
  "requesterName": "Maria Silva",
  "origin": "Parnaiba",
  "destination": "Teresina",
  "departureAt": "2026-06-24T10:00:00.000Z",
  "returnAt": "2026-06-24T18:00:00.000Z",
  "purpose": "Participation in an institutional meeting",
  "passengerCount": 3
}
```

Success status: `201 Created`

### `GET /trip-requests`

Lists all registered trip requests.

Success status: `200 OK`

### `GET /trip-requests/:id`

Retrieves one trip request by id.

Success status: `200 OK`

Possible error: `TRIP_REQUEST_NOT_FOUND`

### `PATCH /trip-requests/:id/cancel`

Cancels an existing trip request by changing its status to `canceled`.

Success status: `200 OK`

Possible errors: `TRIP_REQUEST_NOT_FOUND`, `TRIP_REQUEST_ALREADY_CANCELED`

### `GET /holidays/:year`

Lists Brazilian national holidays for a year using BrasilAPI.

Success status: `200 OK`

Possible errors: `VALIDATION_ERROR`, `HOLIDAYS_API_UNAVAILABLE`

Expected item format:

```json
{
  "date": "2026-01-01",
  "name": "Confraternização Universal",
  "type": "national"
}
```

## Error Codes

- `VALIDATION_ERROR`
- `TRIP_REQUEST_NOT_FOUND`
- `TRIP_REQUEST_ALREADY_CANCELED`
- `HOLIDAY_TRIP_NOT_ALLOWED`
- `HOLIDAYS_API_UNAVAILABLE`
- `INTERNAL_SERVER_ERROR`
