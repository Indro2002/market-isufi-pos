import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { description, amount, category } = req.body || {};
  if (!description || !amount || !category) {
    return res.status(400).json({ error: 'Missing expense data' });
  }

  const result = db.prepare(`
    INSERT INTO expenses (description, amount, category, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).run(description.trim(), Number(amount), category.trim());

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(expense);
});

router.delete('/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(Number(req.params.id));
  if (result.changes === 0) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true });
});

export default router;
