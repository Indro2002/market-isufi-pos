import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM waste ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const { product_id, product_name, qty, reason, loss_value } = req.body || {};
  if (!product_id || !product_name || !qty || !reason || !loss_value) {
    return res.status(400).json({ error: 'Missing waste data' });
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(product_id));
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare(`
    UPDATE products
    SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(Number(qty), product.id);

  const result = db.prepare(`
    INSERT INTO waste (product_id, product_name, qty, reason, loss_value, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(product.id, product.name, Number(qty), reason, Number(loss_value));

  const item = db.prepare('SELECT * FROM waste WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

export default router;
