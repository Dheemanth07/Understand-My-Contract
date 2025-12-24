# ⚖️ Understand My Contract: AI-Powered Legal Document Simplification

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-Active-success.svg)
![Stack](https://img.shields.io/badge/stack-PERN%20Stack-orange.svg)

**Understand My Contract** is an AI-powered platform designed to demystify legal documents, making them accessible and understandable for everyone. By leveraging advanced NLP and full-stack engineering, the platform simplifies dense legal text through automatic processing, clarification, and translation.

---

## 📖 Table of Contents
- [The "What": Project Overview](#overview)
- [The "Why": Problem Statement](#problem)
- [The "How": System Architecture](#architecture)
- [Key Features](#features)
- [Tech Stack](#stack)
- [Getting Started](#getting-started)
- [Future Enhancements](#enhancements)

---

## <a id="overview"></a>🧐 The "What": Project Overview

This platform acts as a bridge between complex legal language and user comprehension. It accepts legal documents (PDF/DOCX) and transforms them into clear, concise summaries and explanations. The system utilizes AI summarization, multilingual translation, and automated glossary generation to make legal content understandable.

The application provides a side-by-side view of the original document and the simplified analysis, ensuring users can verify the information easily.

---

## <a id="problem"></a>⚠️ The "Why": Problem Statement

Legal documents present significant challenges to the general public. We built this solution to address four critical pain points:

1.  **Complexity & Inaccessibility:** Legal documents are dense and laden with jargon, making them inherently difficult for non-professionals to comprehend.
2.  **Prohibitive Legal Fees:** Seeking professional counsel for simple interpretation is costly, creating a barrier to justice.
3.  **Language Barriers:** In multilingual environments, critical legal information is often lost or misunderstood in translation.
4.  **Lack of Clarity:** Ambiguity in contracts leads to disputes and misinterpretations for individuals and businesses alike.

---

## <a id="architecture"></a>🏗 The "How": System Architecture

The platform follows a secure, scalable architecture.

### Data Flow
1.  **Upload:** User uploads a legal document (PDF/Word) via the frontend.
2.  **Security:** The system performs secure document ingestion and virus scanning.
3.  **Processing:** The backend extracts raw text using parsers and segments it into sections.
4.  **AI Analysis:** The AI Engine processes the text for summarization (BART) and jargon extraction.
5.  **Real-Time Delivery:** Results, including translations and glossary terms, are streamed back to the user interface via Server-Sent Events (SSE).
6.  **Storage:** Analysis data is auto-saved to the user's secure history in MongoDB.

---

## <a id="features"></a>🚀 Key Features

* **AI Summarization:** Leverages Hugging Face BART to generate concise, accurate summaries of key clauses and obligations.
* **Multilingual Translation:** Powered by Xenova M2M-100 to convert summaries into various languages.
* **Jargon Extraction:** Automatically identifies and defines complex legal terminology using an in-built glossary.
* **Real-time Updates:** Uses Server-Sent Events (SSE) to provide live progress updates and results without page reloads.
* **Secure Authentication:** Robust user login and session management via Supabase Auth and JWTs.
* **Document History:** Users can access a comprehensive record of all their previously processed documents.

---

## <a id="stack"></a>🛠 Tech Stack

This project is built using a robust full-stack configuration.

### Frontend
* **Framework:** React.js
* **Language:** TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **File Processing:** Multer (uploads), pdf-parse, mammoth (DOCX)

### AI & Data
* **AI Models:** Hugging Face API (BART for summary, M2M-100 for translation).
* **Database:** MongoDB (Data storage), Supabase (Auth & DB).
* **Authentication:** Supabase Auth.

---

## <a id="getting-started"></a>⚡ Getting Started

### Prerequisites
* Node.js
* Supabase Account (Free Tier)
* MongoDB Atlas Account (Free Tier)
* Hugging Face API Token (Free Access)

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/Dheemanth07/understand-my-contract.git
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file and add your credentials:
    ```env
    PORT=3000
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
    MONGODB_URI=your_mongodb_uri
    HUGGING_FACE_TOKEN=your_token
    JWT_SECRET=your_secret
    ```

4.  **Run the App**
    ```bash
    npm run dev
    ```

---

## <a id="enhancements"></a>🔮 Future Enhancements

We are continuously working to expand the platform's capabilities:
* **OCR Integration:** To process scanned image-based legal documents.
* **Voice-Based Explanations:** Audio summaries for enhanced accessibility.
* **Chatbot Assistant:** A GPT-powered Q&A chat for real-time questions about the document.
* **Legal Research API:** Integration with legal databases for case precedents.

---

## 📄 License

Distributed under the MIT License.
