# Market Isufi POS

Final ready-to-run version with:
- real login
- JWT auth
- SQLite database
- products
- sales
- debts
- expenses
- waste
- reports
- localStorage JSON import

## Install
npm install

## Configure
cp .env.example .env

## Run
npm run dev

## Default login
Username: admin
Password: admin

## API
http://localhost:3000/api

## Endpoints
- POST /api/auth/login
- GET /api/products
- POST /api/products
- POST /api/sales
- GET /api/debts
- POST /api/debts
- GET /api/reports/summary
- POST /api/migrate/local
