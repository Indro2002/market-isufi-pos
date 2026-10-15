import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM debts ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { client_name, client_phone, notes, total_amount } = req.body || {};
  if (!client_name || !total_amount) {
    return res.status(400).json({ error: 'Missing debt data' });
  }

  const result = db.prepare(`
    INSERT INTO debts (client_name, client_phone, notes, total_amount, paid_amount, status)
    VALUES (?, ?, ?, ?, 0, 'AKTIV')
  `).run(client_name, client_phone || '', notes || '', Number(total_amount));

  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(debt);
});

router.post('/:id/pay', requireAuth, (req, res) => {
  const debtId = Number(req.params.id);
  const amount = Number(req.body.amount || 0);
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const debt = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId);
  if (!debt) return res.status(404).json({ error: 'Debt not found' });

  const newPaid = Number(debt.paid_amount) + amount;
  const status = newPaid >= Number(debt.total_amount) ? 'I_SHLYER' : 'AKTIV';

  db.prepare(`
    UPDATE debts
    SET paid_amount = ?, status = ?
    WHERE id = ?
  `).run(newPaid, status, debtId);

  db.prepare(`
    INSERT INTO debt_payments (debt_id, amount, date)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `).run(debtId, amount);

  const updated = db.prepare('SELECT * FROM debts WHERE id = ?').get(debtId);
  res.json(updated);
});

export default router;
