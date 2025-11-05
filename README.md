## Restmage — Real Estate Map Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Repo Size](https://img.shields.io/github/repo-size/ManmohanSinghRaghav/Restmage)](https://github.com/ManmohanSinghRaghav/Restmage) ![Built with ❤️](https://img.shields.io/badge/built%20with-%E2%9D%A4-red)

Restmage is a full-stack app for planning and visualizing real-estate projects with interactive maps, cost estimation, export options, and real-time collaboration.

## Table of contents

- Features
- Demo
- Quick start (copy & paste PowerShell)
- API examples
- Project structure
- Contributing
- FAQ

## Features

- 🏠 Property management: create and manage projects with customizable properties
- 🗺️ Interactive maps: create map layers and draw plans with Leaflet
- 💰 Cost estimation: material + labor calculation per project
- 🔄 Real-time collaboration: updates via WebSockets (Socket.IO)
- 🔐 JWT authentication and basic security hardening
- 📄 Export: CSV, JSON, and PDF generation

## Demo

Try the app locally (Quick Start below). If you publish a hosted demo, drop the link here.

Screenshots / GIFs:
<details>
<summary>Click to view example screenshots</summary>

![placeholder-screen](public/placeholder-screenshot.png)

Add a GIF or short video here to showcase creating a project and generating a cost estimate.

</details>

## Quick start (PowerShell)

These copy-paste commands use PowerShell and assume you have Node.js and MongoDB or Atlas available.

1) Clone and install dependencies

```powershell
git clone https://github.com/ManmohanSinghRaghav/Restmage.git
Set-Location Restmage
npm install
cd client; npm install; cd ..
cd server; npm install; cd ..
```

2) Create environment files

Copy templates and edit secrets:

```powershell
Copy-Item server/.env.example server/.env -Force
notepad server/.env
Copy-Item client/.env.example client/.env -Force
notepad client/.env
```

Example `server/.env` values (replace placeholders):

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/restmage?retryWrites=true&w=majority
JWT_SECRET=change-me
CLIENT_URL=http://localhost:3000
```

3) Start both apps (in separate terminals) or use a root script if available

```powershell
# Terminal A - backend
Set-Location .\server
npm run dev

# Terminal B - frontend
Set-Location ..\client
npm start
```

If the repo contains an npm script that starts both (e.g., `npm run dev` from project root), use that instead.

4) Open the app

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## API Examples (curl / PowerShell Invoke-RestMethod)

Register a user:

```powershell
# PowerShell example
$body = @{ name='Uday'; email='uday@example.com'; password='Password123' } | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:5000/api/auth/register -Method Post -Body $body -ContentType 'application/json'
```

Get projects (replace token):

```powershell
$headers = @{ Authorization = 'Bearer YOUR_JWT_TOKEN' }
Invoke-RestMethod -Uri http://localhost:5000/api/projects -Headers $headers -Method Get
```

You can also use curl or Postman; the API follows REST patterns described in the next section.

## Project structure (overview)

```
Restmage/
├─ client/        # React + TypeScript frontend
│  └─ src/
├─ server/        # Express backend
│  ├─ models/
│  ├─ routes/
│  └─ middleware/
├─ package.json   # root scripts (may include dev helper)
└─ README.md
```

## Key API endpoints (summary)

- POST /api/auth/register — register
- POST /api/auth/login — login
- GET /api/projects — list projects
- POST /api/projects — create project
- GET /api/projects/:id/maps — maps for a project
- POST /api/cost/:projectId/calculate — calculate cost

For the full list of endpoints, see the `routes/` folder in the `server/` directory.

## Contributing

Contributions are welcome! A recommended workflow:

1. Fork
2. Create a branch: `git checkout -b feat/my-feature`
3. Commit small changes with clear messages
4. Open a PR and describe the change

Please run tests (if present) before submitting a PR.

## FAQ / Troubleshooting

<details>
<summary>Database connection issues</summary>

- Ensure your `MONGODB_URI` is correct.
- If using Atlas, whitelist your IP or enable access from anywhere for development.

</details>

<details>
<summary>Frontend not loading assets</summary>

- Verify `REACT_APP_API_URL` in `client/.env` points to your backend.

</details>

## Next steps / Ideas

- Add unit & integration tests for core APIs
- Add end-to-end tests for UI flows
- Add a hosted demo link and sample dataset for quick trials

## License

MIT — see the `LICENSE` file.

---

If you'd like, I can also:

- Add an animated GIF to the `public/` folder and embed it in this README
- Create a `README_IMAGES` folder with sample screenshots
- Add a `CONTRIBUTING.md` and a `CODE_OF_CONDUCT.md` template

Built with ❤️ by Uday Kushwah