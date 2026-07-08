// db.js - التعامل مع قاعدة البيانات المخزنة في ملف users.json
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'users.json');

// إنشاء الملف لو مش موجود
function initDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], nextId: 1 }, null, 2));
  }
}

// قراءة البيانات من الملف
function readDB() {
  initDB();
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

// كتابة البيانات في الملف
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
