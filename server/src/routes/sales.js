import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const generateReceipt = () => '#MI-' + Math.floor(100000 + Math.random() * 900000);

const generateFIC = (receipt, total) => {
  const raw = `${receipt}_${new Date().toISOString()}_${total}_MARKET_ISUFI_SECRET`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return 'FIC-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
};

const generateNIVF = (receipt) => `NIVF-${receipt.replace('#MI-', '')}-${Date.now().toString().slice(-6)}`;

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM sales ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', requireAuth, (req, res) => {
  const {
    items = [],
    discount = 0,
    paidAll = 0,
    paidEur = 0,
    eurRate = 100,
    status_pagese = 'PAGUAR',
    client_name = null,
    client_phone = null,
    notes = ''
  } = req.body || {};

  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const total = Math.max(0, subtotal - Number(discount));
  const receipt = generateReceipt();
  const date = new Date().toISOString();

  const saleInsert = db.prepare(`
    INSERT INTO sales (
      receipt, date, subtotal, discount, total, paid_all, paid_eur, change_due, change_currency, eur_rate, status_pagese, fic, nivf, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    receipt,
    date,
    subtotal,
    Number(discount),
    total,
    Number(paidAll),
    Number(paidEur),
    0,
    'ALL',
    Number(eurRate),
    status_pagese,
    generateFIC(receipt, total),
    generateNIVF(receipt),
    req.user.id
  );

  const saleId = saleInsert.lastInsertRowid;

  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.id);
    if (!product) continue;

    db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, product_name, qty, price, buy_price)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      saleId,
      product.id,
      product.name,
      Number(item.qty),
      Number(item.price),
      Number(product.buy_price || 0)
    );

    db.prepare(`
      UPDATE products
      SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(Number(item.qty), product.id);
  }

  if (status_pagese === 'BORXH') {
    db.prepare(`
      INSERT INTO debts (client_name, client_phone, notes, total_amount, paid_amount, status, created_at)
      VALUES (?, ?, ?, ?, 0, 'AKTIV', CURRENT_TIMESTAMP)
    `).run(client_name || 'Klient', client_phone || '', notes || '', total);
  }

  const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
  res.status(201).json({ sale, receipt });
});

export default router;
