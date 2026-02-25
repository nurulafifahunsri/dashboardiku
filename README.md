<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fdf6540b-9b8d-46c5-bcbf-95ad20505467

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## MySQL + Sequelize CRUD API

This project now includes backend API for CRUD, import, and export Excel:
- API source: `server/index.js`
- ORM: Sequelize
- Database: MySQL

### Setup
1. Copy `.env.example` to `.env` (or update your existing env values)
2. Ensure MySQL is running and create database `dashboard_iku` (or change via env)
3. Install dependencies:
   `npm install`
4. Run frontend + backend together:
   `npm run dev:full`

### API Endpoints
- `GET /api/iku` -> list data
- `POST /api/iku` -> create data
- `PUT /api/iku/:id` -> update data
- `DELETE /api/iku/:id` -> delete data
- `POST /api/iku/import` -> import Excel (`file` field)
- `GET /api/iku/export` -> export Excel

### Excel Template
- Template file: `IKU Fakultas-2`
- Header structure follows:
  `id, category, ikuNum, indicator, unit, target_2025...target_2030, achievement_2025...achievement_2030`

## CI/CD Auto Deploy (GitHub Pages)

Workflow file:
`.github/workflows/ci-cd-autodeploy.yml`

What it does:
1. Run CI (`npm ci`, `npm run lint`, `npm run build`) on pull request and push to `main`
2. Auto deploy to GitHub Pages when code is pushed to `main`

One-time setup in GitHub repository:
1. Go to `Settings` -> `Pages`
2. Set `Source` to `GitHub Actions`
