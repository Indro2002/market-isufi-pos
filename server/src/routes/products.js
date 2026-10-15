import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const {
    barcode,
    name,
    unit = 'cope',
    buy_price,
    old_price = 0,
    price,
    stock,
    expiry = null
  } = req.body || {};

  if (!barcode || !name || buy_price === undefined || price === undefined || stock === undefined) {
    return res.status(400).json({ error: 'Missing required product fields' });
  }

  const exists = db.prepare('SELECT id FROM products WHERE barcode = ?').get(barcode.trim());
  if (exists) return res.status(409).json({ error: 'Barcode already exists' });

  const result = db.prepare(`
    INSERT INTO products (barcode, name, unit, buy_price, old_price, price, stock, expiry, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    barcode.trim(),
    name.trim(),
    unit,
    Number(buy_price),
    Number(old_price),
    Number(price),
    Number(stock),
    expiry || null
  );

  const item = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const current = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!current) return res.status(404).json({ error: 'Product not found' });

  const body = req.body || {};
  const barcode = body.barcode ?? current.barcode;
  const name = body.name ?? current.name;
  const unit = body.unit ?? current.unit;
  const buy_price = Number(body.buy_price ?? current.buy_price);
  const old_price = Number(body.old_price ?? current.old_price);
  const price = Number(body.price ?? current.price);
  const stock = Number(body.stock ?? current.stock);
  const expiry = body.expiry ?? current.expiry;

  db.prepare(`
    UPDATE products
    SET barcode = ?, name = ?, unit = ?, buy_price = ?, old_price = ?, price = ?, stock = ?, expiry = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(barcode, name, unit, buy_price, old_price, price, stock, expiry, id);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json(updated);
});

router.delete('/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ success: true });
});

export default router;
