# LegalSimplify - AI-Powered Contract & Legal Document Simplifier

LegalSimplify is a full-stack web application designed to simplify dense, complex legal documents and contracts into plain, readable language. It parses uploaded files, summaries sections, flags risk clauses, generates custom glossaries, and exports print-perfect PDF reports.

The project is structured with a split-service architecture:
- **`frontend`**: React / TypeScript application powered by Vite, Tailwind CSS, and Shadcn UI.
- **`backend`**: Node.js / Express server connected to MongoDB for storage and integrated with Supabase for user session verification.

---

## Key Features

- **Segmented Simplification**: Segments contracts section-by-section and summarizes them using Google Gemini (falling back to Hugging Face BART if limits are reached).
- **Risk & Redline Analysis**: Flags potential legal risks (e.g. automatic renewals, severe liability caps), rates their severity (High/Medium/Low), and suggests counter-proposal recommendations.
- **Automated Jargon Library**: Automatically extracts complex terms from documents, looks up definitions via standard dictionary APIs, and displays them as an integrated search dictionary.
- **Mobile-Responsive UI**: Fully optimized layout for mobile viewports, including slide-out navigation drawers and local network proxy configurations.
- **Clean PDF Exports**: Implements an element-by-element sequential PDF rendering engine to export reports without breaking text blocks or cards across page gaps.

---

## Tech Stack

### Frontend
- React.js (Vite bundler)
- TypeScript
- Tailwind CSS & Shadcn UI Components
- Supabase Client (Authentication and JWT token acquisition)
- Axios (HTTP requests)
- HTML2Canvas & jsPDF (Client-side PDF report exports)

### Backend
- Node.js & Express.js
- MongoDB & Mongoose (Document analysis history)
- Multer (In-memory document buffering with 10MB size limit)
- PDF-Parse & Mammoth (Extracting raw text from `.pdf`, `.docx`, and `.txt` files)
- Google Gemini API & Hugging Face Inference API (Legal processing pipelines)
- Helmet & Express-Rate-Limit (Security headers and DoS prevention)

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database (local instance or MongoDB Atlas cluster)
- Supabase account (with Email provider enabled, email confirmation can be disabled)
- Google Gemini API key and/or Hugging Face API key

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `backend/` folder:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_private_service_role_key
   GEMINI_API_KEY=your_gemini_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   FRONTEND_URL=http://localhost:8080
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_public_anon_key
   VITE_BACKEND_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The app will run locally at `http://localhost:8080`.

---

## Running Verification & Tests

### Backend Tests
Ensure your backend environment is fully functional by running integration test suites:
```bash
cd backend
npm test
```

### Frontend Typechecking & Lints
Verify types and lints before committing changes:
```bash
cd frontend
npm run typecheck
npm run lint
```

### Production Build
To check that the frontend builds correctly for production:
```bash
cd frontend
npm run build
```

---

## Production Deployment Checklist

### Vercel (Frontend)
- Enable environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_BACKEND_URL` (pointing to Render).
- Build command: `npm run build`
- Output directory: `dist`

### Render (Backend)
- Enable environment variables: `MONGODB_URI`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `HUGGINGFACE_API_KEY`, and `FRONTEND_URL` (set to your frontend's live Vercel URL).
- Render automatically manages `PORT` bindings; the backend is configured to accept requests on port `5000` or whatever port Render injects.
- Make sure to update the **Redirect URLs** and **Site URL** settings in your Supabase Auth dashboard to direct authenticated users back to your live Vercel site.
