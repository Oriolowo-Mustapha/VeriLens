# VeriLens: AI-Powered Fake News Detection Platform

VeriLens is a modern web application that leverages AI to analyze news articles and images, helping users determine if content is **Fake**, **Real**, or **Suspicious**. The platform features a clean, responsive frontend and a robust Node.js/Express backend.

## Features
- AI News Verification
- Image Claim Verification
- Credibility Scoring
- Real-time Analysis
- User Authentication & History
- Admin Management

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, MongoDB
- **Frontend:** HTML, Tailwind CSS, Vanilla JavaScript
- **AI Services:** Integrated via backend services

## Project Structure
```
/ (root)
  |-- src/
      |-- Controllers/
      |-- Middleware/
      |-- Models/
      |-- Routes/
      |-- Services/
      |-- Types/
      |-- Utils/
  |-- css/
  |-- js/
  |-- index.html
  |-- analyze.html
  |-- package.json
  |-- API_DOC.md
  |-- README.md
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or cloud)

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Fake News Detection System
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env` and fill in required values (MongoDB URI, JWT secrets, etc.)
4. Build the project:
   ```bash
   npm run build
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### Frontend
- Open `index.html` or `analyze.html` in your browser, or serve via a static server.
- The frontend communicates with the backend API (see `API_DOC.md` for endpoints).

## API Documentation
See [API_DOC.md](./API_DOC.md) for detailed endpoint descriptions, request/response formats, and authentication requirements.

## Deployment
- The app can be deployed on any Node.js hosting platform.
- Ensure environment variables are set in production.
- Example deployment: [https://verilens.pxxl.click](https://verilens.pxxl.click)

## License
MIT

---

> Built with ❤️ for trustworthy information.
