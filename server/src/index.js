import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import debtsRoutes from './routes/debts.js';
import expensesRoutes from './routes/expenses.js';
import wasteRoutes from './routes/waste.js';
import reportsRoutes from './routes/reports.js';
import migrateRoutes from './routes/migrate.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Market Isufi API is alive' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/debts', debtsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/migrate', migrateRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
