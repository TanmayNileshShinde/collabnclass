# CollabClass 🚀

<p align="left">
  <a href="https://collabnclass.vercel.app"><img src="https://img.shields.io/badge/Live_Demo-collabnclass.vercel.app-0070F3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
  <a href="https://github.com/TanmayNileshShinde/collabnclass/stargazers"><img src="https://img.shields.io/github/stars/TanmayNileshShinde/collabnclass?style=for-the-badge&logo=github&color=ffb86c" alt="Stars" /></a>
  <a href="https://github.com/TanmayNileshShinde/collabnclass/network/members"><img src="https://img.shields.io/github/forks/TanmayNileshShinde/collabnclass?style=for-the-badge&logo=github&color=8be9fd" alt="Forks" /></a>
  <a href="./SECURITY.md"><img src="https://img.shields.io/badge/Security-Policy-2ea44f?style=for-the-badge&logo=shield" alt="Security Policy" /></a>
</p>

A comprehensive, full-stack collaborative learning and video conferencing application. Built with a TypeScript React (Vite) frontend and an Express backend, CollabClass seamlessly integrates real-time video communication, collaborative whiteboarding, AI assistance, and GitHub repository importing to create an ultimate virtual classroom or developer workspace.

---

## 🌟 Features

- **🎥 Real-time Video & Audio**: HD video conferencing powered by Stream.io.
- **🔐 Secure Authentication**: User management and authentication handled via Clerk.
- **🎨 Collaborative Whiteboard**: Real-time drawing and brainstorming utilizing Excalidraw.
- **🐙 GitHub Repository Import**: Import and discuss GitHub codebases directly in your sessions.
- **🤖 AI Chatbot Integration**: Intelligent assistance powered by the Groq API.
- **📅 Meeting Management**: Schedule upcoming meetings, view previous calls, and access recordings.
- **🗄️ Persistent Data Storage**: Integrated with Supabase for robust database management.

---

## 🏗️ Project Structure

The project utilizes a monorepo-style structure managed via concurrent scripts:

```text
collabnclass/
├── frontend/          # React 18 + Vite + TypeScript
│   ├── src/
│   │   ├── components/# Reusable UI components (Radix UI, Tailwind)
│   │   ├── pages/     # Route pages (Home, Meeting, PersonalRoom, etc.)
│   │   ├── contexts/  # Theme & Chat contexts
│   │   └── providers/ # StreamClient Provider
└── backend/           # Express + Node.js + TypeScript
    └── src/
        ├── routes/    # API routes (stream.ts, github.ts, chatbot.ts)
        └── server.ts  # Express server entry point
```
## 💻 Tech Stack

### Frontend
- **Framework**: React 18 (Vite) & TypeScript
- **Styling**: Tailwind CSS, Radix UI primitives
- **SDKs & Libraries**: Stream.io Video React SDK, Clerk React, Supabase JS, Excalidraw

### Backend
- **Environment**: Node.js with Express & TypeScript
- **SDKs**: Stream.io Node SDK, Clerk Node SDK, Groq SDK

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher)
- Docker (optional, for containerized running)
- API Keys for: Clerk, Stream.io, GitHub, Supabase, and Groq.

### 2. Installation
Clone the repository and install dependencies for both the frontend and backend simultaneously using the root script:

```
git clone <repository-url>
cd collabnclass
npm run install:all
```
### 3. Environment Variables
Create a .env file in the backend directory:
```
PORT=4000
FRONTEND_URL=http://localhost:3000
STREAM_API_KEY=your_stream_api_key
STREAM_SECRET_KEY=your_stream_secret_key
CLERK_SECRET_KEY=your_clerk_secret_key
GITHUB_TOKEN=your_github_personal_access_token
GROQ_API_KEY=your_groq_api_key
```
Create a .env file in the frontend directory:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_STREAM_API_KEY=your_stream_api_key
VITE_BASE_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
### 4. Running the Application
#### Option A: Local Development
You can start both the frontend and backend development servers concurrently from the root directory:

```
npm run dev
```
- Frontend: http://localhost:3000

- Backend: http://localhost:4000

#### Option B: Docker Setup
To run the application using Docker Compose:

```
docker-compose up --build
```

---

## 📜 Available Scripts
From the root directory, you can run:

- npm run dev - Starts both frontend and backend development servers concurrently.

- npm run install:all - Installs dependencies in both frontend and backend folders.

- npm run build:frontend - Builds the frontend for production.

- npm run build:backend - Compiles the backend TypeScript code.
