# 📑 Understand My Contract: AI-Powered Legal Document Simplification
**Submission for the Gen AI Exchange Hackathon**

---

## 🌟 Project Pitch
**Understand My Contract** is a web-based platform that uses **Generative AI** to transform dense, intimidating legal documents into **simple, easy-to-understand summaries**, empowering everyone to sign with clarity and confidence.

---

## 🤔 The Problem
Legal documents—like rental agreements, terms of service, and employment contracts—are filled with complex jargon that most people don't understand.  

This creates a **power imbalance**, often leading to individuals agreeing to **unfavorable terms** simply because the language is inaccessible.

---

## ✨ Our Solution
Our platform provides a **secure and user-friendly environment** where anyone can upload a legal document (PDF, DOCX, or TXT) and receive an **instant, AI-powered analysis**.  

### Features:
- 📃 **Side-by-side comparison** of the original text next to a plain-language summary.  
- 📖 **Interactive glossary** that defines complex terms with a simple hover.  
- 🌍 **Multi-language support** to bridge language barriers.  

---

## 🚀 Getting Started & How to Run

Follow these instructions to run the project on your local machine.

### ✅ Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)  
- [npm](https://www.npmjs.com/)  
- [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (with a local MongoDB server running)  

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Dheemanth07/understand-my-contract.git
cd understand-my-contract
```
### 2️⃣ Configure Backend
Navigate to the backend folder:
```bash
cd backend
```
Create a .env file and add the following variables:
```env
MONGODB_URI=mongodb://127.0.0.1:27017
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_service_key
HUGGINGFACE_API_KEY=your_hugging_face_api_key
PORT=5000
```
Install dependencies and start the server:
```bash
npm install
npm start
```
The backend will be running at:
👉 http://localhost:5000

### 3️⃣ Configure Frontend
Navigate back to the root directory:
```bash
cd ..
```
Create a .env file in the root folder and add your public Supabase keys:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key
```
Install dependencies and start the frontend:
```bash
npm install
npm run dev
```
The frontend will be running at the default Vite dev server URL (usually http://localhost:5173
).

## 🛠 Tech Stack
- Frontend: Vite + React
- Backend: Node.js + Express
- Database: MongoDB
- Authentication & Storage: Supabase
- AI Models: Hugging Face APIs
  
## 🙌 Acknowledgments
- Supabase for authentication & database tools.
- Hugging Face for AI model APIs.
- MongoDB for scalable database solutions.
