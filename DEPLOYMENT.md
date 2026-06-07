# Deployment Checklist — ขึ้น EC2

เอกสารนี้สรุปสิ่งที่ต้องทำเพื่อย้ายจาก **Netlify** ไปรันบน **EC2** (เครื่องเปล่า)

> โปรเจกต์นี้เป็น **frontend อย่างเดียว** (Vite + React SPA)
> backend (API) แยกอยู่คนละที่ เรียกผ่าน `VITE_CONTEXT_URL`

ปัจจุบัน Netlify จัดการ 4 อย่างนี้ให้ฟรี ซึ่งบน EC2 ต้องเซ็ตเองทั้งหมด:
1. เสิร์ฟไฟล์ static (`dist/`)
2. SPA fallback routing (`public/_redirects`)
3. Redirect รูปภาพ
4. Serverless function รับ payment callback (`netlify/functions/return-2c2p.cjs`)

---

## ✅ Checklist สรุป

- [ ] **1. ตั้งค่า `.env`** — ใส่ค่าจริง (ดู `.env.example`)
- [ ] **2. ติดตั้ง Node + build** — `npm install && npm run build` ได้ `dist/`
- [ ] **3. ติดตั้ง nginx เสิร์ฟ `dist/`**
- [ ] **4. ตั้ง SPA fallback routing ใน nginx** ⚠️ ถ้าลืม refresh แล้ว 404
- [ ] **5. แทน Netlify function `return-2c2p`** ⚠️ ถ้าลืม ระบบจ่ายเงินพัง
- [ ] **6. ติดตั้ง HTTPS/SSL + โดเมน** (OAuth บังคับ)
- [ ] **7. อัปเดต config ที่ฝั่ง OAuth providers + 2C2P** (นอกโค้ด)

---

## 1. ตั้งค่า `.env`

copy `.env.example` เป็น `.env` แล้วใส่ค่าจริง โดยเฉพาะ:

| ตัวแปร | หมายเหตุ |
|--------|----------|
| `VITE_CONTEXT_URL` | ตอนนี้ยังเป็น `https://<PUBLIC_URL>/membershipms` → ใส่ URL backend จริง |
| `VITE_AUTH_GOOGLE_ID` | Google OAuth Client ID |
| `VITE_AUTH_FACEBOOK_ID` | Facebook App ID |
| `VITE_AUTH_LINE_LIFF` | Line LIFF ID |

> หมายเหตุ: ค่า env ของ Vite จะถูก **build เข้าไปใน bundle ตอน `npm run build`**
> ดังนั้นต้องตั้งค่า `.env` ให้ครบ **ก่อน** build เสมอ (ไม่ใช่ค่า runtime)

---

## 2. ติดตั้ง Node + build

```bash
# บน EC2 (หรือ build ที่เครื่อง local แล้วอัป dist/ ขึ้นไปก็ได้)
npm install
npm run build      # ได้โฟลเดอร์ dist/
```

---

## 3 + 4. nginx เสิร์ฟ static + SPA routing ⚠️

ไฟล์ `public/_redirects` ใช้ได้เฉพาะ Netlify — **บน nginx ต้องเขียน config ใหม่**

ต้องแปลง 2 rule เดิมจาก `_redirects`:
```
/assets/images/*  /assets/images/:splat  200   → เสิร์ฟไฟล์รูปตรงๆ
/* /index.html 200                              → SPA fallback
```

ตัวอย่าง nginx config:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/register/dist;     # ชี้ไปที่ dist/
    index index.html;

    # SPA fallback — สำคัญ! ถ้าไม่มี refresh route ใดๆ จะ 404
    location / {
        try_files $uri $uri/ /index.html;
    }

    # cache asset ที่มี hash ในชื่อไฟล์
    location /assets/ {
        try_files $uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 5. แทน Netlify function `return-2c2p` ⚠️ (จุดที่พังง่ายสุด)

`netlify/functions/return-2c2p.cjs` ทำหน้าที่:
> รับ **POST callback** จาก payment gateway 2C2P → ดึงค่า `paymentResponse`
> → ตอบ **303 redirect** แปลงเป็น GET ไปที่ `/registrationPaymentResult?payload=...`

บน EC2 **ไม่มี serverless function** ตัวนี้ → ถ้าไม่ทำอะไร ระบบจ่ายเงินจะพังตอน 2C2P ส่งผลกลับมา

ทางเลือกในการแทน:
- **(แนะนำ)** เขียน endpoint เล็กๆ ด้วย Node/Express ทำตรรกะเดียวกับ `return-2c2p.cjs` แล้วให้ nginx reverse proxy ไปที่มัน
- ทำใน nginx ล้วนๆ — ยุ่งยากเพราะต้องอ่าน POST body มาแกะค่า `paymentResponse`

ตัวอย่าง Express endpoint (ตรรกะเดียวกับ function เดิม):

```js
// payment-return.js  (รันด้วย node, ให้ nginx proxy /payment-return มาที่ port นี้)
import express from "express";
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/payment-return", (req, res) => {
  const paymentResponse =
    req.body.paymentResponse ?? (typeof req.body === "string" ? req.body : "");
  // TODO: verify signature + update order status ฝั่ง server ที่นี่
  res.redirect(
    303,
    `/registrationPaymentResult?payload=${encodeURIComponent(paymentResponse)}`
  );
});

app.listen(8090);
```

แล้วเพิ่มใน nginx:
```nginx
location = /payment-return {
    proxy_pass http://127.0.0.1:8090;
}
```

> อย่าลืมแก้ **return URL ที่ตั้งไว้ในระบบ 2C2P** ให้ชี้มาที่ endpoint ใหม่นี้

---

## 6. HTTPS / SSL + โดเมน

OAuth (Google / Facebook / Line LIFF) **บังคับ HTTPS** — รันบน http เฉยๆ login ไม่ได้

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 7. อัปเดต config ที่ฝั่ง provider (นอกโค้ด — ลืมง่าย)

domain เปลี่ยน ต้องไปตั้งค่าที่ console ของแต่ละเจ้า:

- **Google Cloud Console** → เพิ่ม domain EC2 ใน *Authorized JavaScript origins* / *redirect URIs*
- **Facebook Developers** → เพิ่ม domain ใน *Valid OAuth Redirect URIs* / App domains
- **Line Developers (LIFF)** → แก้ *Endpoint URL* ของ LIFF เป็นโดเมนใหม่
- **2C2P** → แก้ frontend/backend return URL ให้ชี้มาที่ EC2 (ดูข้อ 5)

---

## สรุปจุดที่ "พังเงียบ" ถ้าลืม

| ลืมทำ | อาการ |
|-------|-------|
| ข้อ 4 (SPA fallback) | refresh หน้าใดๆ แล้วเจอ 404 |
| ข้อ 5 (payment return) | จ่ายเงินเสร็จแล้วเด้งกลับไม่ได้ / หน้า payment result พัง |
| ข้อ 6 (HTTPS) | ปุ่ม login Google/FB/Line กดไม่ติด |
| ข้อ 7 (provider config) | login เด้ง error redirect_uri mismatch |
