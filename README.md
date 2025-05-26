# ExamForge

**ExamForge** is an AI-powered web platform designed to help students prepare for exams. Its primary function is to transform study materials (like PDFs and DOCX files) into interactive learning experiences. It uses AI to process uploaded documents, extract relevant content, and generate practice questions. Users can then take quizzes based on this generated content, organize their study materials by subject, and track their progress through analytics.

---

## 🛠 Technologies Used

- **Frontend:**
  - React
  - Vite
  - TypeScript
  - Tailwind CSS
  - shadcn-ui (based on Radix UI)
  - React Router DOM

- **Backend:**
  - Supabase
    - Authentication
    - Database
    - File Storage (likely used for uploaded documents)

- **AI:**
  - Google Generative AI
  - OCR (Optical Character Recognition)
  - Question Generation

---

## 🧩 Key Components

### 🔹 Frontend Application

A single-page application (SPA) built with React. Key elements include:

- **Pages:**
  - Dashboard
  - Subjects
  - Analytics
  - Quiz
  - Upload
  - Authentication

- **UI Library:**
  - `shadcn-ui` (built on Radix UI)
  - Tailwind CSS for styling

- **Navigation:**
  - Managed by React Router DOM

### 🔹 Supabase Backend

- **Authentication:**
  - Handles user sign-up and sign-in.

- **Database:**
  - Stores:
    - User data
    - Subjects
    - Uploaded documents
    - Generated questions
    - Quiz results

- **File Storage:**
  - Used to store uploaded study materials.

### 🔹 AI Integration

- **OCR:**
  - Extracts text and possibly questions from document images or non-text formats.

- **Question Generation:**
  - Uses Google Generative AI to create practice questions from uploaded content.

---
