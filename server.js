// server.js - نقطة انطلاق تطبيق API (تخزين البيانات في users.json)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

app.use(express.json());

// ------------------ الصفحة الرئيسية ------------------
app.get('/', (req, res) => {
  res.json({
    message: '🚀 مرحباً بك في Users API',
    status: 'الخادم شغال بنجاح',
    help: 'زور /help للحصول على شرح كامل لكل الروابط المتوفرة'
  });
});

// ------------------ صفحة المساعدة ------------------
app.get('/help', (req, res) => {
  res.json({
    title: 'دليل استخدام Users API',
    endpoints: [
      {
        method: 'GET',
        path: '/api/register/:username/:password/:email',
        description: 'تسجيل مستخدم جديد عن طريق رابط واحد',
        example: '/api/register/ahmed/123456/ahmed@example.com'
      },
      {
        method: 'GET',
        path: '/api/login/:email/:password',
        description: 'تسجيل الدخول عن طريق رابط واحد، يرجع token',
        example: '/api/login/ahmed@example.com/123456'
      },
      {
        method: 'POST',
        path: '/api/register',
        description: 'تسجيل مستخدم جديد (الطريقة الآمنة عبر JSON body)',
        body: { name: 'string', email: 'string', password: 'string' }
      },
      {
        method: 'POST',
        path: '/api/login',
        description: 'تسجيل دخول (الطريقة الآمنة عبر JSON body)، يرجع token',
        body: { email: 'string', password: 'string' }
      },
      {
        method: 'GET',
        path: '/api/users',
        description: 'عرض كل المستخدمين (يتطلب توكن بالـ Header: Authorization: Bearer TOKEN)'
      },
      {
        method: 'GET',
        path: '/api/users/:id',
        description: 'عرض مستخدم واحد (يتطلب توكن)'
      },
      {
        method: 'PUT',
        path: '/api/users/:id',
        description: 'تعديل بيانات مستخدم (يتطلب توكن)',
        body: { name: 'string (اختياري)', email: 'string (اختياري)' }
      },
      {
        method: 'DELETE',
        path: '/api/users/:id',
        description: 'حذف مستخدم (يتطلب توكن)'
      }
    ]
  });
});

// ------------------ Middleware للتحقق من التوكن ------------------
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'لا يوجد توكن، الرجاء تسجيل الدخول' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'توكن غير صالح أو منتهي' });
  }
}

// ------------------ تسجيل مستخدم جديد (عن طريق رابط واحد بالترتيب) ------------------
// مثال: /api/register/ahmed/123456/ahmed@example.com
app.get('/api/register/:username/:password/:email', (req, res) => {
  try {
    const { username, password, email } = req.params;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'اسم المستخدم وكلمة المرور والإيميل مطلوبين' });
    }

    const data = readDB();

    const existing = data.users.find(u => u.email === email);
    if (existing) {
      return res.status(409).json({ error: 'هذا الإيميل مستخدم من قبل' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = {
      id: data.nextId,
      name: username,
      email,
      password: hashedPassword,
      created_at: new Date().toISOString()
    };

    data.users.push(newUser);
    data.nextId += 1;
    writeDB(data);

    res.status(201).json({
      message: 'تم إنشاء الحساب بنجاح',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ', details: err.message });
  }
});

// ------------------ تسجيل مستخدم جديد (Register) ------------------
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'الاسم والإيميل وكلمة المرور مطلوبة' });
  }

  const data = readDB();

  const existing = data.users.find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'هذا الإيميل مستخدم من قبل' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: data.nextId,
    name,
    email,
    password: hashedPassword,
    created_at: new Date().toISOString()
  };

  data.users.push(newUser);
  data.nextId += 1;
  writeDB(data);

  res.status(201).json({
    message: 'تم إنشاء الحساب بنجاح',
    user: { id: newUser.id, name: newUser.name, email: newUser.email }
  });
});

// ------------------ تسجيل الدخول (عن طريق رابط واحد بالترتيب) ------------------
// مثال: /api/login/ahmed@example.com/123456
app.get('/api/login/:email/:password', (req, res) => {
  const { email, password } = req.params;

  const data = readDB();
  const user = data.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'الإيميل أو كلمة المرور غير صحيحة' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'الإيميل أو كلمة المرور غير صحيحة' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// ------------------ تسجيل الدخول ------------------
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'الإيميل وكلمة المرور مطلوبان' });
  }

  const data = readDB();
  const user = data.users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({ error: 'الإيميل أو كلمة المرور غير صحيحة' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'الإيميل أو كلمة المرور غير صحيحة' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

// ------------------ عرض كل المستخدمين (يتطلب تسجيل دخول) ------------------
app.get('/api/users', authMiddleware, (req, res) => {
  const data = readDB();
  const users = data.users.map(({ password, ...rest }) => rest); // إخفاء كلمة المرور
  res.json(users);
});

// ------------------ عرض مستخدم واحد ------------------
app.get('/api/users/:id', authMiddleware, (req, res) => {
  const data = readDB();
  const user = data.users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ------------------ تعديل بيانات مستخدم ------------------
app.put('/api/users/:id', authMiddleware, (req, res) => {
  const { name, email } = req.body;
  const data = readDB();
  const user = data.users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  user.name = name || user.name;
  user.email = email || user.email;
  writeDB(data);

  res.json({ message: 'تم تحديث بيانات المستخدم بنجاح' });
});

// ------------------ حذف مستخدم ------------------
app.delete('/api/users/:id', authMiddleware, (req, res) => {
  const data = readDB();
  const index = data.users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  data.users.splice(index, 1);
  writeDB(data);

  res.json({ message: 'تم حذف المستخدم بنجاح' });
});

// ------------------ أي رابط غير موجود ------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'هذا الرابط غير موجود',
    tip: 'زور /help عشان تشوف كل الروابط المتوفرة'
  });
});

// ------------------ تشغيل السيرفر ------------------
// على Vercel، ما نستخدم app.listen (Vercel يشغّل التطبيق تلقائياً كـ serverless function)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال على http://localhost:${PORT}`);
  });
}

module.exports = app;
