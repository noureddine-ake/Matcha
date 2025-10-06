# 💞 Web Matcha

**Version 5.1 – Because love, too, can be industrialized.**

Web Matcha is a full-stack dating web application built with **Next.js**, **Express.js**, **PostgreSQL**, and **Nginx**.
It provides registration, profile matching, chat, and notification features within a secure, real-time, and scalable architecture.

---

## ⚙️ Tech Stack

| Layer              | Technology     | Purpose                             |
| ------------------ | -------------- | ----------------------------------- |
| Frontend           | **Next.js**    | Modern SSR/CSR frontend with React  |
| Backend            | **Express.js** | REST API and Socket.IO handling     |
| Database           | **PostgreSQL** | User, chat, and matching data       |
| Proxy / Deployment | **Nginx**      | Reverse proxy, SSL, static delivery |

---

## 🧱 Development Workflow

### Branching Model

* `main` → Production-ready branch
* `dev` → Integration branch for active work
* Feature branches: `feature/<short-description>`
* Fix branches: `fix/<short-description>`

### Workflow Steps

1. **Create a Linear issue** (with title and description).
2. **Branch from `dev`** using the issue ID and title:

   ```
   git checkout -b feature/LIN-123-chat-system
   ```
3. Develop your feature following code and design standards.
4. Push your branch and open a **Pull Request (PR)** into `dev`.

   * PR title should include Linear issue ID:

     ```
     LIN-123: Implement chat system backend
     ```
5. In the PR description, include:

   ```
   Closes LIN-123
   ```

   → This automatically links and closes the Linear issue when merged.
6. Once reviewed and tested, merge `dev` → `main` during release.

---

## 🧠 Commit Rules

Follow **Conventional Commits**:

```
feat: add new chat endpoint
fix: resolve message duplication bug
refactor: optimize profile query
docs: update setup instructions
```

* Use **clear, concise messages**.
* Each commit should address **only one logical change**.
* Always check code formatting and lint before committing:

  ```
  npm run lint && npm run format
  ```

---

## 🧩 Design & Code Patterns

### Backend (Express)

* Use **MVC** structure:

  ```
  server/
  ├── models/
  ├── controllers/
  ├── routes/
  └── middlewares/
  ```
* Keep controllers small and logic-driven.
* Use parameterized queries or an ORM (e.g., Sequelize/Prisma).
* Always validate inputs with middleware (e.g., `express-validator`).
* Handle all errors with a global error handler.

### Frontend (Next.js)

* Keep components modular: `components/`, `pages/`, `hooks/`, `lib/`.
* Use **server components** for data fetching when possible.
* Centralize API calls under `/lib/api/`.
* Keep styles consistent with Tailwind CSS design tokens.
* Ensure mobile responsiveness by default.

---

## 🗂️ Using Linear for Task Management

### Workflow

* **Backlog** → Not started
* **Todo** → Approved to begin
* **In Progress** → Actively developed
* **Review** → Awaiting PR review
* **Done** → Merged and verified

### Priority Levels

| Level     | Meaning                     |
| --------- | --------------------------- |
| 🔥 High   | Core or blocking features   |
| ⚙️ Medium | Enhancements and UI updates |
| 🧹 Low    | Minor fixes and maintenance |

### Creating and Linking Work

1. Create a Linear issue for every feature or bug.
2. Include a **clear description and acceptance criteria**.
3. Use the **issue ID** (e.g., `LIN-123`) in:

   * **Branch name**
   * **PR title**
   * **Commit messages**
4. When opening a PR, reference the issue:

   ```
   Closes LIN-123
   ```

   → This ensures automatic linking and closure on merge.

---

## 🔐 Security Rules

* Hash all passwords using **bcrypt**.
* Use **JWT** for authentication and protect all private routes.
* Validate all incoming API requests.
* Never store credentials or secrets in the repo — use `.env`.
* Enable HTTPS in production (handled by **Nginx**).
* Sanitize all user input to prevent **SQL injection** and **XSS**.

---

## 🧰 Developer Environment Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env` files for both backend and frontend:

```
DATABASE_URL=postgres://user:password@localhost:5432/matcha
JWT_SECRET=your_secret
```

### Run Development

```bash
npm run dev
```

### Run with Nginx (Production)

* Configure Nginx to reverse proxy:

  * `/api` → Express backend
  * `/` → Next.js build
* Ensure SSL certificates are configured in `/etc/nginx/sites-enabled/`.

---

## 🧩 Pull Request Quality Checklist

Before submitting a PR:

* [ ] Code builds without errors
* [ ] Follows naming and commit conventions
* [ ] All comments and console logs removed
* [ ] Security checks passed
* [ ] Linked to a Linear issue
* [ ] Tested on local environment

---

## 🤝 Contributing

1. Assign yourself to a Linear issue.
2. Create a feature branch based on that issue.
3. Follow all naming and commit conventions.
4. Submit a PR referencing the Linear ID.
5. Wait for review, fix comments, then merge.

---

## 🧾 License

This project is private and intended for internal educational use.

---

## 💬 Maintainers

Web Matcha Core Development Team
Built with ❤️ using **Next.js**, **Express.js**, **PostgreSQL**, and **Nginx**.
