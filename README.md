# Assessment Agile

Herramienta web para evaluar y acompañar la madurez de equipos Scrum. SPA estática con Firebase como backend.

→ Documentación funcional completa en [PROYECTO.md](PROYECTO.md)

---

## Stack

- **Frontend:** HTML / CSS / JavaScript Vanilla
- **Base de datos:** Firebase Firestore
- **Auth:** Firebase Authentication
- **Backend:** Firebase Cloud Functions (Node.js 22)
- **Hosting:** Firebase Hosting
- **Tests:** Vitest

## Requisitos previos

- Node.js 22+
- Firebase CLI: `npm install -g firebase-tools`
- Acceso al proyecto Firebase `agile-assessment-5a117` (solicitar al owner)

## Setup local

```bash
# 1. Clonar e instalar dependencias raíz (tests, lint, pre-commit hook)
git clone https://github.com/Jrvl83/AgileAssessment.git
cd AgileAssessment
npm install

# 2. Instalar dependencias de Cloud Functions
cd functions && npm install && cd ..

# 3. Autenticarse en Firebase
firebase login
```

El frontend corre directamente en el navegador contra el proyecto Firebase de producción — no hay servidor local ni emuladores configurados. Abre `admin.html` con Live Server (VS Code) o cualquier servidor HTTP estático.

## Tests

```bash
npm test           # corre los 96 tests (scoring, analysis, evolution)
npm run test:watch # modo watch
```

## Lint y formato

```bash
npm run lint          # ESLint sobre assets/ y tests/
npm run format        # Prettier — formatea todo
npm run format:check  # verifica sin modificar (lo hace el pre-commit hook)
```

El pre-commit hook corre ESLint + Prettier automáticamente al hacer `git commit`.

## Secrets

`ANTHROPIC_API_KEY` vive en Google Secret Manager (no en `.env`). Para configurarla:

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
# pegar la clave cuando lo solicite
```

La CF `analyzeTeamWithClaude` la lee vía `runWith({ secrets: ['ANTHROPIC_API_KEY'] })`.

## Deploy

```bash
firebase deploy              # hosting + functions
firebase deploy --only hosting
firebase deploy --only functions
```

El CI/CD (GitHub Actions) despliega automáticamente al hacer push a `main`.

## Datos de prueba

`seed-data.js` contiene un script para poblar Firestore con 4 equipos, 3 ciclos y 68 respuestas de prueba. Pegarlo en la consola del navegador estando logueado en `/admin`.
