# CivicAI - Civic Accountability & Governance Platform

An advanced, zero-documentation civic tech platform designed for frictionless reporting, AI triage, and integrity protection.

## Features Included
- **Dual-Pathway Dashboard**: Clear pathways for "Departmental Service Hub" and "Integrity & Legal Shield".
- **Frictionless Auth**: Simulated phone-based OTP login.
- **Smart Reporting**: Connects to an Express backend for issue submission and status tracking.
- **Legal Automation**: Displays a 21-day statutory countdown timer for all open civic reports.
- **Status Tracker**: Linear visual status tracking (Submitted &rarr; In Progress &rarr; Resolved &rarr; Escalated).

## Local Setup

**Prerequisites**: Node.js 18+

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - Create a `.env.local` or `.env` file in the root directory.
   - Set the following variables (e.g., your Gemini API key for AI features):
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Start the Application**
   Run the following command to start both the Vite React frontend and the Express backend concurrently:
   ```bash
   npm run dev
   ```

4. **Access the Platform**
   - **Frontend**: http://localhost:5173
   - **Backend**: API runs concurrently on http://localhost:3000

## Quick Demo Accounts
- **Citizen Login**: Click the "Auto-fill Credentials" on the Citizen Login page (Simulates any Phone + 6-digit OTP).
- **Admin/Officer Login**: Use the predefined credentials shown on the Admin Login Portal.
