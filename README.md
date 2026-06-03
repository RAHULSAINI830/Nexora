# Cortexy

Cortexy is a full-stack dashboard starter with this core flow:

1. Fetch data from an external API.
2. Store a normalized copy in our own database.
3. Read dashboard views from our database.

The app has these role levels:

- `DEVELOPER`: sees every account and dataset.
- `SUPER_ADMIN`: manages a company workspace below developer.
- `BUSINESS_OWNER`: manages users and settings inside one company.
- `MARKETING_MANAGER`, `OPERATIONS_MANAGER`, `BRANCH_MANAGER`, `TECHNICIAN`, `ANALYST`: scoped operational roles.

## Structure

- `server`: Node.js + Express API, SQLite storage, auth, data sync boundary.
- `client`: React + Vite dashboard UI.
- `api`: Vercel serverless entrypoint for the Express API.

## Local Setup

```bash
npm install
npm run db:seed
npm run dev:server
npm run dev:client
```

Default seeded login:

- Email: `developer@cortexy.local`
- Password: `developer123`

## Vercel Deployment

The project includes `vercel.json` and `api/index.js`.

Vercel settings:

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `client/dist`

Required environment variables:

```bash
JWT_SECRET="replace-this-with-a-long-random-production-secret"
CLIENT_ORIGINS="https://your-project.vercel.app"
DATABASE_FILE="/tmp/cortexy.db"
EXTERNAL_API_URL=""
EXTERNAL_API_KEY=""
BOOTSTRAP_DEVELOPER_EMAIL="developer@yourdomain.com"
BOOTSTRAP_DEVELOPER_PASSWORD="replace-with-a-strong-password"
```

Important: SQLite on Vercel is not persistent. `/tmp/cortexy.db` can be reset when a serverless instance restarts. For production, move the database to a hosted provider such as Postgres, Neon, Supabase, Turso, or another managed database.
