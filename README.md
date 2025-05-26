# ExamForge 📚

<img src="public/favicon.ico" alt="ExamForge Logo" height="250">

**ExamForge** is an AI-powered platform designed to help students prepare for exams. It transforms study materials (PDFs and DOCX files) into interactive learning experiences using AI to process uploaded documents, extract relevant content, and generate practice questions. Users can take quizzes, organize study materials by subject, and track their progress through analytics.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- A Supabase account
- A Google AI Studio account (for Gemini API)

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd examforge-ai-prep
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**

Create a `.env` file in the root directory with the following variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 🔑 Supabase Setup

1. **Create a Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Fill in your project details
   - Save the `URL` and `anon` public key for your `.env` file

2. **Configure Authentication**
   - In your Supabase dashboard, go to Authentication → Settings
   - Configure your desired auth providers (Email, Google, etc.)

3. **Update Environment Variables**
   - Copy your project URL and anon key
   - Update `.env` file with these values

### 🤖 Gemini API Setup

1. **Get API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated key

2. **Configure API Key**
   - Add the key to your `.env` file
   - For production, add it to Supabase:
     - Go to Supabase Dashboard → Settings → Edge Functions
     - Add `GEMINI_API_KEY` as an environment variable

3. **Deploy Edge Function**
```bash
npx supabase functions deploy process-document
```

### 🏃‍♂️ Running the Project

1. **Start development server**
```bash
npm run dev
```

2. **Build for production**
```bash
npm run build
```

3. **Preview production build**
```bash
npm run preview
```

## 🛠 Technologies Used

- **Frontend:**
  - React with TypeScript
  - Vite
  - Tailwind CSS
  - shadcn-ui (based on Radix UI)
  - React Router DOM

- **Backend:**
  - Supabase
    - Authentication
    - Database
    - File Storage
    - Edge Functions

- **AI Integration:**
  - Google Generative AI (Gemini)
  - OCR for document processing
  - Question Generation

## 🧩 Key Features

- 📝 Document Upload and Processing
- 🤖 AI-Powered Question Generation
- 📚 Subject Organization
- ✍️ Interactive Quizzes
- 📊 Progress Analytics
- 👥 User Authentication
- 🎨 Modern, Responsive UI

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Keep your API keys secret and secure
- For production, always use Supabase Edge Functions environment variables
- Don't store sensitive keys in client-side code

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📝 License

[MIT License](LICENSE)

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
