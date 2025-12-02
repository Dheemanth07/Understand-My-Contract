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

## 🧪 Testing

The project uses **Jest** with **React Testing Library** for comprehensive unit testing.

### Running Tests

Available test commands:
- `npm test` or `npm run test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode for development
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode (with coverage)

### Test Structure

Tests are located in `src/__tests__/` directory and organized by feature:
- `src/__tests__/lib/` - Tests for utility functions and library code
- `src/__tests__/hooks/` - Tests for React hooks
- `src/__tests__/utils/` - Common test helpers and mocks

### Test Files Included

- `utils.test.ts` - Tests for the `cn()` class name merging utility
- `supabaseClient.test.ts` - Tests for Supabase client initialization
- `use-mobile.test.tsx` - Tests for the responsive mobile detection hook
- `use-toast.test.tsx` - Tests for the toast notification system

### Coverage Requirements

The project maintains a **70% coverage threshold** for:
- Branches
- Functions
- Lines
- Statements

View detailed coverage reports in the `coverage/` directory after running `npm run test:coverage`.

### Writing Tests

Example test structure:
```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('does something expected', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current).toBe(expectedValue);
  });
});
```

For more information, see the [React Testing Library documentation](https://testing-library.com/react).

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
