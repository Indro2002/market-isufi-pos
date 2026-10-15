import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', requireAuth, (req, res) => {
  const totalSales = db.prepare('SELECT COALESCE(SUM(total), 0) AS total FROM sales').get().total;
  const totalExpenses = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM expenses').get().total;
  const activeDebt = db.prepare(`
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) AS total
    FROM debts
    WHERE status = 'AKTIV'
  `).get().total;

  const salesCount = db.prepare('SELECT COUNT(*) AS c FROM sales').get().c;

  res.json({
    totalSales: Number(totalSales),
    totalExpenses: Number(totalExpenses),
    totalProfit: Number(totalSales) - Number(totalExpenses),
    activeDebt: Number(activeDebt),
    salesCount
  });
});

router.get('/sales', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 50').all();
  res.json(rows);
});

export default router;
