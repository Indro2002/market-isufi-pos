import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'market-isufi.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ADMIN',
      full_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL DEFAULT 'cope',
      buy_price REAL NOT NULL DEFAULT 0,
      old_price REAL DEFAULT 0,
      price REAL NOT NULL DEFAULT 0,
      stock REAL NOT NULL DEFAULT 0,
      expiry TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      paid_all REAL NOT NULL DEFAULT 0,
      paid_eur REAL NOT NULL DEFAULT 0,
      change_due REAL NOT NULL DEFAULT 0,
      change_currency TEXT DEFAULT 'ALL',
      eur_rate REAL DEFAULT 100,
      status_pagese TEXT DEFAULT 'PAGUAR',
      fic TEXT,
      nivf TEXT,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      price REAL NOT NULL,
      buy_price REAL NOT NULL,
      FOREIGN KEY(sale_id) REFERENCES sales(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS debts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      client_phone TEXT,
      notes TEXT,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'AKTIV',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS debt_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      debt_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(debt_id) REFERENCES debts(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS waste (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      qty REAL NOT NULL,
      reason TEXT NOT NULL,
      loss_value REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get(process.env.ADMIN_USERNAME || 'admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin', 10);
    db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name)
      VALUES (?, ?, 'ADMIN', 'Market Isufi Admin')
    `).run(process.env.ADMIN_USERNAME || 'admin', hash);
  }

  const eurRate = db.prepare('SELECT value FROM settings WHERE key = ?').get('eur_rate');
  if (!eurRate) {
    db.prepare(`INSERT INTO settings (key, value) VALUES ('eur_rate', '100')`).run();
  }

  const seedProducts = [
    { barcode: '1001', name: 'Ujë Tepelene 1.5L', unit: 'cope', buy_price: 40, old_price: 70, price: 60, stock: 45, expiry: '2027-06-30' },
    { barcode: '1002', name: 'Buka e Boshit 600g', unit: 'cope', buy_price: 70, old_price: 0, price: 100, stock: 20, expiry: '' },
    { barcode: '1003', name: 'Kafe Lavazza 250g', unit: 'cope', buy_price: 320, old_price: 500, price: 450, stock: 12, expiry: '2026-12-15' },
    { barcode: '1004', name: 'Mish Viçi Kg', unit: 'kg', buy_price: 850, old_price: 0, price: 1100, stock: 8.5, expiry: '' },
    { barcode: '1005', name: 'Mollë e Kuqe Kg', unit: 'kg', buy_price: 70, old_price: 0, price: 120, stock: 25, expiry: '' },
    { barcode: '1006', name: 'Vaj Luledielli 1L', unit: 'cope', buy_price: 150, old_price: 240, price: 210, stock: 3, expiry: '2027-01-10' }
  ];

  for (const p of seedProducts) {
    const exists = db.prepare('SELECT id FROM products WHERE barcode = ?').get(p.barcode);
    if (!exists) {
      db.prepare(`
        INSERT INTO products (barcode, name, unit, buy_price, old_price, price, stock, expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        p.barcode,
        p.name,
        p.unit,
        p.buy_price,
        p.old_price,
        p.price,
        p.stock,
        p.expiry || null
      );
    }
  }
};

createTables();

export { db };
