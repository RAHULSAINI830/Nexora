# Cortexy

Cortexy is a full-stack dashboard starter with this core flow:

1. Fetch data from an external API.
2. Store a normalized copy in our own database.
3. Read dashboard views from our database.

The app has three role levels:

- `DEVELOPER`: sees every account and dataset.
- `ADMIN`: manages one account and the users inside it.
- `USER`: views data for their assigned account.

## Structure

- `server`: Node.js + Express API, Prisma schema, auth, data sync boundary.
- `client`: React + Vite dashboard UI.

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
