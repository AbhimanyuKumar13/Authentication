# 🔐 MERN Authentication System

A complete **MERN stack authentication system** that includes secure user registration, login, password reset, and email verification.  
Built with **React (Vite)** for the frontend and **Node.js + Express + MongoDB (Mongoose)** for the backend.

---

## 🚀 Features

### 🌐 Frontend (Client)
- Built with **React + Vite**
- Responsive and modern UI
- Authentication pages:
  - Register
  - Login
  - Forgot Password
  - OTP Verification
  - Reset Password
- API integration with backend

### ⚙️ Backend (Server)
- Built using **Express.js** and **MongoDB**
- User authentication with JWT
- Secure password hashing with bcrypt
- OTP-based email verification
- Forgot/Reset password via email
- Auto removal of unverified users (via automation script)
- Middleware-based error handling
- Environment variable configuration via `config.env`

---

## 🗂️ Folder Structure


---

## ⚡ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/AbhimanyuKumar13/Authentication.git
cd Authentication
cd server
npm install
cd ../client
npm install
npm run dev
cd server
npm install
nodemon start 
Now open your browser and visit:
👉 http://localhost:5173
