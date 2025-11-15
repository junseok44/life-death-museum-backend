# 📝 Life Death Museum Backend

This is a backend server built with **TypeScript** and **Express**.

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Development**: `ts-node-dev` (for hot-reloading)
- **Code Quality**: ESLint + Prettier

---

## 🚀 Installation and Execution

### 1. Install Dependencies

```bash
npm install
```

### 2\. Configure Environment Variables

Create a `.env` file by referencing `env.example`:

```bash
cp env.example .env
```

Open `.env` and set the required values:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=<database_url>
CORS_ORIGIN=*
```

### 3\. Run Development Server

```bash
npm run dev
```

The server will be accessible at `http://localhost:3000`.

### 4\. Production Build

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
src/
├── config/          # Configuration files (database connection, etc.)
├── controller/      # Controllers (business logic and route setup)
├── models/          # Mongoose models
├── middleware/      # Middleware setup
├── types/           # TypeScript type definitions
└── app.ts           # Express application entry point
```

---

## 📡 API Endpoints

### Health Check

- `GET /health` - Check server status

### Example Routes

- `GET /api/example` - Example GET endpoint
- `POST /api/example` - Example POST endpoint

---

## 🧑‍💻 Development Guide

### Adding a New Route

1.  Create a new controller file in `src/controller/`.
2.  Register the route in `src/controller/index.ts` using `setupRoutes`.
3.  Write the controller functions in the new controller file.
4.  If necessary, add a Mongoose model in `src/models/`.

### Adding Environment Variables

1.  Add the variable to the `.env` file.
2.  Access it using `process.env.VARIABLE_NAME` in `src/app.ts` or the necessary file.

---

## ⚙️ Scripts

| Script                 | Description                           |
| :--------------------- | :------------------------------------ |
| `npm run dev`          | Run development server (hot-reload)   |
| `npm run build`        | Compile TypeScript to JavaScript      |
| `npm start`            | Run production server                 |
| `npm run lint`         | Check code linting                    |
| `npm run lint:fix`     | Automatically fix code linting issues |
| `npm run format`       | Format code using Prettier            |
| `npm run format:check` | Check code formatting only            |

---

## ✨ Code Quality Management

### ESLint

The project manages code quality using ESLint for TypeScript.

```bash
# Check linting
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Prettier

Code formatting is handled by Prettier.

```bash
# Format all code
npm run format

# Only check formatting
npm run format:check
```

### VS Code Configuration (Optional)

If you are using VS Code, add the following to your `.vscode/settings.json` for automatic formatting and fixing on save:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
