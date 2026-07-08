# Users API

API بسيط لإدارة بيانات المستخدمين مبني على Node.js + Express + SQLite.

## المميزات
- تسجيل مستخدم جديد (Register) مع تشفير كلمة المرور
- تسجيل دخول (Login) باستخدام JWT
- عرض كل المستخدمين
- عرض مستخدم واحد
- تعديل بيانات مستخدم
- حذف مستخدم

## التثبيت والتشغيل

```bash
# 1. تثبيت المكتبات
npm install

# 2. تشغيل السيرفر
npm start
```

السيرفر بيشتغل على: `http://localhost:3000`

## الـ Endpoints

### 1. تسجيل مستخدم جديد
```
POST /api/register
Content-Type: application/json

{
  "name": "أحمد",
  "email": "ahmed@example.com",
  "password": "123456"
}
```

### 2. تسجيل الدخول
```
POST /api/login
Content-Type: application/json

{
  "email": "ahmed@example.com",
  "password": "123456"
}
```
سيرجع لك `token` استخدمه في باقي الطلبات.

### 3. عرض كل المستخدمين
```
GET /api/users
Authorization: Bearer <TOKEN>
```

### 4. عرض مستخدم واحد
```
GET /api/users/:id
Authorization: Bearer <TOKEN>
```

### 5. تعديل بيانات مستخدم
```
PUT /api/users/:id
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "name": "اسم جديد",
  "email": "new@example.com"
}
```

### 6. حذف مستخدم
```
DELETE /api/users/:id
Authorization: Bearer <TOKEN>
```

## ملاحظات مهمة
- غيّر قيمة `JWT_SECRET` في ملف `server.js` قبل رفع المشروع لبيئة الإنتاج (Production).
- البيانات تتخزن بملف `users.json` بيتولد تلقائي أول ما تشغل السيرفر أو أول تسجيل مستخدم.
- تقدر تجرب الـ API باستخدام Postman أو Thunder Client أو curl.

### ⚠️ تنبيه مهم عن التخزين بملف JSON على استضافة مجانية
أغلب الاستضافات المجانية (زي Render أو Railway الخطة المجانية) عندها **نظام ملفات مؤقت (ephemeral)**:
- أي تعديل يصير على `users.json` وقت اشتغال السيرفر (تسجيل مستخدم جديد، حذف، تعديل) بينمسح لما السيرفر يعيد التشغيل أو "ينام" بعد فترة خمول.
- يعني لو مستخدم سجل حساب اليوم، ممكن يختفي بعد شوي إذا السيرفر أعاد التشغيل.
- هذا الملف مناسب فقط للتجربة المحلية (على جهازك) أو لو الاستضافة عندها **تخزين دائم (Persistent Disk)**، وغالباً هذا يكون بخطط مدفوعة.

إذا تبي البيانات تضل محفوظة دايماً مجاناً، الحل الأفضل هو قاعدة بيانات أونلاين مجانية زي Supabase أو MongoDB Atlas.

## تجربة سريعة عبر curl

```bash
# تسجيل مستخدم
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"أحمد","email":"ahmed@example.com","password":"123456"}'

# تسجيل دخول
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@example.com","password":"123456"}'
```
