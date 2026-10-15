import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/local', requireAuth, (req, res) => {
  const data = req.body || {};
  const products = Array.isArray(data.products) ? data.products : [];
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const debts = Array.isArray(data.debts) ? data.debts : [];
  const waste = Array.isArray(data.waste) ? data.waste : [];

  for (const product of products) {
    const exists = db.prepare('SELECT id FROM products WHERE barcode = ?').get(product.barcode);
    if (!exists) {
      db.prepare(`
        INSERT INTO products (barcode, name, unit, buy_price, old_price, price, stock, expiry, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        product.barcode || 'imported',
        product.name || 'Imported product',
        product.unit || 'cope',
        Number(product.buyPrice || 0),
        Number(product.oldPrice || 0),
        Number(product.price || 0),
        Number(product.stock || 0),
        product.expiry || null,
        new Date().toISOString(),
        new Date().toISOString()
      );
    }
  }

  for (const expense of expenses) {
    db.prepare(`
      INSERT INTO expenses (description, amount, category, created_at)
      VALUES (?, ?, ?, ?)
    `).run(
      expense.desc || 'Imported expense',
      Number(expense.amount || 0),
      expense.category || 'Të tjera',
      expense.date || new Date().toISOString()
    );
  }

  for (const debt of debts) {
    db.prepare(`
      INSERT INTO debts (client_name, client_phone, notes, total_amount, paid_amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      debt.klient_emri || 'Imported client',
      debt.klient_telefon || '',
      debt.notes || '',
      Number(debt.shuma_totale || 0),
      Number(debt.shuma_e_paguar || 0),
      debt.statusi || 'AKTIV',
      debt.data_krijimit || new Date().toISOString()
    );
  }

  for (const item of waste) {
    db.prepare(`
      INSERT INTO waste (product_id, product_name, qty, reason, loss_value, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      1,
      item.productName || 'Imported item',
      Number(item.qty || 0),
      item.reason || 'Imported',
      Number(item.lossValue || 0),
      item.date || new Date().toISOString()
    );
  }

  res.json({
    success: true,
    imported: {
      products: products.length,
      expenses: expenses.length,
      debts: debts.length,
      waste: waste.length
    }
  });
});

export default router;
