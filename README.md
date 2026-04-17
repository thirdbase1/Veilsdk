# v0 Clone - AI-Powered UI Builder

A high-fidelity, 100% functional clone of the v0.dev interface. Built with Next.js 15, Tailwind CSS v4, and integrated with **OpenRouter** and **Vercel Sandbox**.

## Features

- **Conversational UI Generation:** Chat with AI models (via OpenRouter) to generate production-ready React/Next.js code.
- **Vercel Sandbox Integration:** Generated code is executed in isolated, ephemeral microVMs. The "Preview" tab shows a live-running dev server.
- **Model Selector:** Switch between different AI models (Gemini, Llama, Mistral) directly in the chat input. Icons scale from "Fast & Lazy" to "Powerful".
- **Self-Healing Code:** If the sandbox encounter a build error, logs are automatically sent back to the AI for an "Auto-fix".
- **AI Reviewer:** Integrated secondary AI check that critizies and refines the generated code against your prompt.
- **Persistence & Auth:** Uses Local Storage to save your code and a basic email-auth barrier.

## Prerequisites

- Node.js 18+
- [OpenRouter API Key](https://openrouter.ai/keys)
- [Vercel OIDC Token](https://vercel.com/docs/vercel-sandbox/authentication)

## Setup

1. **Clone the repository.**
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Create a `.env.local` file (based on `.env.example`):
   ```env
   OPENROUTER_API_KEY=your_key
   VERCEL_OIDC_TOKEN=your_token
   ```

## Running the Project

1. **Start the development server:**
   ```bash
   npm run dev
   ```
2. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

## Architecture

- **Frontend:** Next.js App Router, Tailwind CSS v4, Framer Motion.
- **Backend:**
  - `/api/chat`: Streams generation from OpenRouter.
  - `/api/sandbox`: Manages microVMs and code updates via Vercel Sandbox SDK.
  - `/api/review`: Conducts high-level AI code reviews.

## Professional System Prompt

The application uses a specialized system prompt for v0, focusing on:
- Next.js 14/15 App Router best practices.
- Tailwind CSS responsive utility classes.
- Shadcn UI component patterns.
- High-fidelity visual aesthetics.
