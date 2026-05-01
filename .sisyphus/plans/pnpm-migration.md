# pnpm Migration Plan

**Status**: Ready to Execute  
**Created**: 2026-04-30  
**Complexity**: Medium  
**Estimated Duration**: 2-3 hours (including testing)

---

## Overview

Migrate the Matcha project from `npm` to `pnpm` for faster installs, better disk usage, and stricter dependency management. This involves:
- Creating a pnpm workspace (root-level coordination)
- Converting npm lockfiles to pnpm-lock.yaml
- Updating all Dockerfiles to use pnpm
- Updating docker-compose.yml for pnpm's symlink structure
- Testing locally and in Docker

---

## Pre-Execution Checklist

- [x] Backup current state (create git branch) - Done via git commits (a5e1607, 32f15f6)
- [x] Understand pnpm basics (symlinks, shamefully-hoist) - Applied in .npmrc
- [x] Have Docker running - Verified during Phase 9 testing
- [x] pnpm not yet installed globally (will install in Phase 1) - Installed in Phase 1 (v10.33.2)

---

## Phase 1: Local Setup & Workspace Creation

### Task 1.1: Install pnpm Globally
- **File**: N/A (global npm install)
- **Action**: Run `npm install -g pnpm@latest`
- **Verify**: `pnpm --version` outputs 8.x or 9.x
- **Why**: All subsequent commands use pnpm

### Task 1.2: Create Root pnpm Workspace Configuration
- **File**: `/Matcha/pnpm-workspace.yaml` (NEW)
- **Action**: Create file with workspace package declarations
- **Content**:
  ```yaml
  packages:
    - 'backend'
    - 'frontend'
  ```
- **Verify**: File exists at correct location
- **Why**: Unifies both packages under single pnpm installation

### Task 1.3: Create Root .npmrc Configuration
- **File**: `/Matcha/.npmrc` (NEW)
- **Action**: Create with pnpm-specific settings
- **Content**:
  ```ini
  shamefully-hoist=true
  strict-peer-dependencies=false
  ```
- **Verify**: File exists and is readable
- **Why**: Flattens node_modules like npm (easier Docker handling), allows flexible peer deps

### Task 1.4: Add Engine Constraints to Backend
- **File**: `/Matcha/backend/package.json`
- **Action**: Add engines field after "type" field
- **Change**:
  ```json
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
  ```
- **Verify**: JSON is valid (use `jq . package.json`)
- **Why**: Enforces correct tool versions for all contributors

### Task 1.5: Add Engine Constraints to Frontend
- **File**: `/Matcha/frontend/package.json`
- **Action**: Add engines field after "private" field
- **Change**:
  ```json
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
  ```
- **Verify**: JSON is valid
- **Why**: Same as 1.4

### Task 1.6: Convert Backend Lockfile
- **File**: `/Matcha/backend/package-lock.json` → `/Matcha/backend/pnpm-lock.yaml`
- **Action**: From `/Matcha/backend/`, run `pnpm import`
- **Verify**: `pnpm-lock.yaml` exists, `package-lock.json` still exists (delete later)
- **Why**: Converts npm lock format to pnpm lock format

### Task 1.7: Convert Frontend Lockfile
- **File**: `/Matcha/frontend/package-lock.json` → `/Matcha/frontend/pnpm-lock.yaml`
- **Action**: From `/Matcha/frontend/`, run `pnpm import`
- **Verify**: `pnpm-lock.yaml` exists, `package-lock.json` still exists (delete later)
- **Why**: Same as 1.6

### Task 1.8: Install All Dependencies via pnpm
- **File**: N/A (monorepo install)
- **Action**: From project root, run `pnpm install`
- **Expected**: Both backend and frontend node_modules populated from pnpm
- **Verify**: `pnpm list` shows all packages, no errors during install
- **Why**: Validates workspace setup and lockfiles before Docker migration

---

## Phase 2: Test Local Development

### Task 2.1: Test Backend Dev Server
- **File**: `/Matcha/backend/` (dev server execution)
- **Action**: Run `pnpm -C backend run dev` (or `cd backend && pnpm dev`)
- **Expected**: Server starts on localhost:5000 with no errors
- **Verify**: Logs show "Ready in XXXms" and watch mode active
- **Duration**: 30 seconds
- **Why**: Ensures pnpm deps resolve correctly and dev script works

### Task 2.2: Test Frontend Dev Server
- **File**: `/Matcha/frontend/` (dev server execution)
- **Action**: Run `pnpm -C frontend run dev` (or `cd frontend && pnpm dev`)
- **Expected**: Next.js server starts on localhost:3000 with no errors
- **Verify**: Logs show "✓ Ready in XXXms"
- **Duration**: 60 seconds (Next.js build is slower)
- **Why**: Same as 2.1

### Task 2.3: Test Backend Linting (if applicable)
- **File**: `/Matcha/backend/` (eslint execution)
- **Action**: Run `pnpm -C backend lint` or check if lint script exists
- **Expected**: No errors (may have pre-existing warnings)
- **Verify**: Lint completes or script doesn't exist (OK)
- **Why**: Validate deps haven't broken linting

### Task 2.4: Test Frontend Linting
- **File**: `/Matcha/frontend/` (eslint execution)
- **Action**: Run `pnpm -C frontend lint`
- **Expected**: No errors
- **Verify**: Lint completes
- **Why**: Same as 2.3

---

## Phase 3: Update Backend Dockerfile

### Task 3.1: Uncomment pnpm Global Install
- **File**: `/Matcha/backend/Dockerfile`
- **Line**: 8
- **Current**: `# RUN npm install -g pnpm@latest`
- **Change To**: `RUN npm install -g pnpm@latest`
- **Verify**: Line is uncommented
- **Why**: Install pnpm in Docker base image

### Task 3.2: Update Production Dependencies Installation
- **File**: `/Matcha/backend/Dockerfile`
- **Line**: 18
- **Current**: `RUN npm install --only=production && npm cache clean --force`
- **Change To**: `RUN pnpm install --prod --frozen-lockfile`
- **Verify**: npm command replaced with pnpm
- **Why**: Use pnpm and frozen lockfile for reproducible builds

### Task 3.3: Update Dev Dependencies Installation
- **File**: `/Matcha/backend/Dockerfile`
- **Line**: 26
- **Current**: `RUN npm install --include=dev && npm cache clean --force`
- **Change To**: `RUN pnpm install --frozen-lockfile`
- **Verify**: npm command replaced with pnpm
- **Why**: Same as 3.2

### Task 3.4: Update Development Stage Cmd
- **File**: `/Matcha/backend/Dockerfile`
- **Line**: 36
- **Current**: `CMD ["sh", "-c", "while true; do npm run dev; done"]`
- **Change To**: `CMD ["sh", "-c", "while true; do pnpm dev; done"]`
- **Verify**: npm replaced with pnpm
- **Why**: Use pnpm to run dev script

### Task 3.5: Verify Backend Dockerfile Syntax
- **File**: `/Matcha/backend/Dockerfile`
- **Action**: Run `docker build --target development --progress=plain -f /Matcha/backend/Dockerfile /Matcha/backend 2>&1 | head -50`
- **Expected**: Build starts without parse errors (may not complete due to installs)
- **Verify**: No "Dockerfile syntax error" messages
- **Why**: Catch syntax errors before full build

---

## Phase 4: Update Frontend Dockerfile

### Task 4.1: Add pnpm Global Install
- **File**: `/Matcha/frontend/Dockerfile`
- **Line**: After `RUN apk update...` (around line 5)
- **Current**: No pnpm install
- **Change To**: Add line: `RUN npm install -g pnpm@latest`
- **Verify**: Line is present before first COPY
- **Why**: Install pnpm in base image

### Task 4.2: Update Production Dependencies Installation
- **File**: `/Matcha/frontend/Dockerfile`
- **Line**: Around 17 (in dependencies stage)
- **Current**: `RUN npm install --omit=dev && npm cache clean --force`
- **Change To**: `RUN pnpm install --prod --frozen-lockfile`
- **Verify**: npm replaced with pnpm
- **Why**: Same as backend 3.2

### Task 4.3: Update Dev Dependencies Installation
- **File**: `/Matcha/frontend/Dockerfile`
- **Line**: Around 25 (in dev-dependencies stage)
- **Current**: `RUN npm install && npm cache clean --force`
- **Change To**: `RUN pnpm install --frozen-lockfile`
- **Verify**: npm replaced with pnpm
- **Why**: Same as backend 3.3

### Task 4.4: Update Development Stage Cmd
- **File**: `/Matcha/frontend/Dockerfile`
- **Line**: Around 35 (in development stage)
- **Current**: `CMD ["sh", "-c", "while true; do npm run dev; done"]`
- **Change To**: `CMD ["sh", "-c", "while true; do pnpm dev; done"]`
- **Verify**: npm replaced with pnpm
- **Why**: Same as backend 3.4

### Task 4.5: Update Builder Stage Build Command
- **File**: `/Matcha/frontend/Dockerfile`
- **Line**: Around 43 (in builder stage)
- **Current**: `RUN npm run build`
- **Change To**: `RUN pnpm build`
- **Verify**: npm replaced with pnpm
- **Why**: Use pnpm for build

### Task 4.6: Update Production Stage Start Command
- **File**: `/Matcha/frontend/Dockerfile`
- **Line**: Around 55 (in production stage)
- **Current**: `CMD ["npm", "start"]`
- **Change To**: `CMD ["pnpm", "start"]`
- **Verify**: npm replaced with pnpm
- **Why**: Use pnpm to start app

### Task 4.7: Verify Frontend Dockerfile Syntax
- **File**: `/Matcha/frontend/Dockerfile`
- **Action**: Run `docker build --target development --progress=plain -f /Matcha/frontend/Dockerfile /Matcha/frontend 2>&1 | head -50`
- **Expected**: Build starts without parse errors
- **Verify**: No syntax errors
- **Why**: Catch errors early

---

## Phase 5: Update docker-compose.yml

### Task 5.1: No Volume Changes Required (shamefully-hoist)
- **File**: `/Matcha/docker-compose.yml`
- **Lines**: 52-55 (backend volumes), 73-75 (frontend volumes)
- **Current**: 
  ```yaml
  volumes:
    - ./backend:/app
    - /app/node_modules
  ```
- **Action**: NO CHANGES NEEDED (shamefully-hoist makes node_modules flat like npm)
- **Why**: .npmrc files we created make pnpm act like npm for volumes
- **Verify**: Compare with current, ensure no accidental edits
- **Note**: If you want advanced pnpm store mounting later, revisit this

---

## Phase 6: Update Root .gitignore

### Task 6.1: Add pnpm Cache Entries
- **File**: `/Matcha/.gitignore`
- **Action**: Add these lines at the end:
  ```
  # pnpm
  .pnpm-store
  pnpm-debug.log
  ```
- **Verify**: File contains new entries
- **Why**: Ignore pnpm-specific files and caches

---

## Phase 7: Update Documentation

### Task 7.1: Update README.md Installation Section
- **File**: `/Matcha/README.md`
- **Find**: "Install Dependencies" or "Getting Started" section
- **Current**: References `npm install`
- **Change To**: Reference `pnpm install`
- **Verify**: README reflects pnpm workflow
- **Why**: Users should follow correct setup

### Task 7.2: Update README.md Development Section
- **File**: `/Matcha/README.md`
- **Find**: "Run Development" or "Development Workflow" section
- **Current**: References `npm run dev`
- **Change To**: References `pnpm -C backend dev` and `pnpm -C frontend dev` (or `cd backend && pnpm dev`)
- **Verify**: README matches actual commands
- **Why**: Users should use correct commands

### Task 7.3: Update README.md Build Section
- **File**: `/Matcha/README.md`
- **Find**: "Build" or "Production Build" section
- **Current**: References `npm run build`
- **Change To**: References `pnpm -C frontend build`
- **Verify**: README is consistent
- **Why**: Match actual workflow

### Task 7.4: Update README.md Lint Section
- **File**: `/Matcha/README.md`
- **Find**: "Linting" or "Code Quality" section
- **Current**: References `npm run lint`
- **Change To**: References `pnpm lint` or `pnpm -C backend lint`
- **Verify**: Consistent
- **Why**: Match actual workflow

### Task 7.5: Add pnpm Note to Commit Rules
- **File**: `/Matcha/README.md`
- **Find**: "Commit Rules" section
- **Action**: Add this note:
  ```markdown
  - Use pnpm for all dependency management: `pnpm install`, `pnpm add`, etc.
  - Only commit `pnpm-lock.yaml` files, never `package-lock.json`
  - Delete old npm lockfiles when encountered
  ```
- **Verify**: Note is added and clear
- **Why**: Set expectations for all contributors

---

## Phase 8: Git Cleanup (Delete Old Lockfiles)

### Task 8.1: Remove Backend package-lock.json from Git
- **File**: `/Matcha/backend/package-lock.json`
- **Action**: 
  ```bash
  git rm --cached /Matcha/backend/package-lock.json
  ```
- **Verify**: File is staged for deletion
- **Why**: Remove old npm lockfile from version control

### Task 8.2: Remove Frontend package-lock.json from Git
- **File**: `/Matcha/frontend/package-lock.json`
- **Action**: 
  ```bash
  git rm --cached /Matcha/frontend/package-lock.json
  ```
- **Verify**: File is staged for deletion
- **Why**: Remove old npm lockfile from version control

### Task 8.3: Add pnpm Lockfiles to Git
- **File**: `/Matcha/backend/pnpm-lock.yaml`, `/Matcha/frontend/pnpm-lock.yaml`
- **Action**: 
  ```bash
  git add /Matcha/backend/pnpm-lock.yaml
  git add /Matcha/frontend/pnpm-lock.yaml
  ```
- **Verify**: Files are staged for commit
- **Why**: Version control new pnpm lockfiles

### Task 8.4: Commit Migration Changes
- **File**: Multiple (all above changes)
- **Action**: 
  ```bash
  git commit -m "chore: migrate from npm to pnpm

  - Create pnpm-workspace.yaml for monorepo coordination
  - Create .npmrc with shamefully-hoist=true for Docker compatibility
  - Convert package-lock.json to pnpm-lock.yaml
  - Update backend and frontend Dockerfiles to use pnpm
  - Update docker-compose.yml environment
  - Update README.md with pnpm commands
  - Add pnpm cache to .gitignore"
  ```
- **Verify**: Commit succeeds, `git log` shows new commit
- **Why**: Track migration in git history

---

## Phase 9: Test Docker Build & Compose

### Task 9.1: Build Backend Development Image
- **File**: N/A (Docker build process)
- **Action**: 
  ```bash
  cd /Matcha
  docker build -f backend/Dockerfile --target development -t matcha-backend:dev .
  ```
- **Expected**: Build succeeds, final stage is `development`
- **Verify**: `docker images | grep matcha-backend` shows the image
- **Duration**: 5-10 minutes (first npm install in container)
- **Why**: Validate backend Dockerfile works with pnpm

### Task 9.2: Build Frontend Development Image
- **File**: N/A (Docker build process)
- **Action**: 
  ```bash
  cd /Matcha
  docker build -f frontend/Dockerfile --target development -t matcha-frontend:dev .
  ```
- **Expected**: Build succeeds, final stage is `development`
- **Verify**: `docker images | grep matcha-frontend` shows the image
- **Duration**: 10-15 minutes (Next.js build)
- **Why**: Validate frontend Dockerfile works with pnpm

### Task 9.3: Start Full Docker Compose Stack
- **File**: `/Matcha/docker-compose.yml`
- **Action**: 
  ```bash
  cd /Matcha
  docker compose down  # Clean up old containers
  docker compose up -d
  ```
- **Expected**: All services start (postgres, redis, backend, frontend)
- **Verify**: 
  - `docker compose ps` shows all services running
  - Backend logs: `docker compose logs backend | tail -20` shows "Ready in XXXms"
  - Frontend logs: `docker compose logs frontend | tail -20` shows "✓ Ready in XXXms"
- **Duration**: 2-3 minutes
- **Why**: Full integration test

### Task 9.4: Test Backend via HTTP
- **File**: N/A (HTTP request)
- **Action**: 
  ```bash
  curl -s http://localhost:5000/health || curl -s http://localhost:5000/
  ```
- **Expected**: Response from backend (any response means server is running)
- **Verify**: No connection errors, response received
- **Duration**: 5 seconds
- **Why**: Verify backend is responsive

### Task 9.5: Test Frontend via HTTP
- **File**: N/A (HTTP request)
- **Action**: 
  ```bash
  curl -s http://localhost:3000 | head -20
  ```
- **Expected**: HTML response from Next.js
- **Verify**: Response starts with `<!DOCTYPE` or similar
- **Duration**: 5 seconds
- **Why**: Verify frontend is responsive

### Task 9.6: Check Container Logs for Errors
- **File**: N/A (Log inspection)
- **Action**: 
  ```bash
  docker compose logs backend
  docker compose logs frontend
  ```
- **Expected**: No error messages, only normal startup/running logs
- **Verify**: Scan logs for "ERROR", "error", "failed", "crash" - should have zero matches
- **Duration**: 10 seconds
- **Why**: Catch runtime issues

---

## Phase 10: Smoke Test (Optional but Recommended)

### Task 10.1: Test Backend API Endpoint
- **File**: N/A (API test)
- **Action**: Hit a real backend endpoint (e.g., login, users) with curl or Postman
- **Expected**: 200 or expected error status (not 500)
- **Verify**: Response is JSON and parseable
- **Why**: Validate backend logic still works

### Task 10.2: Test Frontend Page Load
- **File**: N/A (Browser test)
- **Action**: Open http://localhost:3000 in browser, check console for errors
- **Expected**: Page loads, no red console errors
- **Verify**: DOM renders, no Network errors in browser DevTools
- **Why**: Validate frontend rendering still works

---

## Phase 11: Cleanup & Final Verification

### Task 11.1: Delete Old npm Lockfiles (Local)
- **File**: `/Matcha/backend/package-lock.json`, `/Matcha/frontend/package-lock.json`
- **Action**: Delete both files (they're already removed from git)
  ```bash
  rm /Matcha/backend/package-lock.json
  rm /Matcha/frontend/package-lock.json
  ```
- **Verify**: Files are deleted
- **Why**: Avoid confusion with old npm lockfiles

### Task 11.2: Verify No Stray npm References
- **File**: N/A (grep across codebase)
- **Action**: 
  ```bash
  grep -r "npm install" /Matcha --exclude-dir=node_modules --exclude-dir=.git --exclude="*.lock"
  grep -r "npm run" /Matcha --exclude-dir=node_modules --exclude-dir=.git
  ```
- **Expected**: Only matches in comments or docs mentioning "pnpm" or no matches
- **Verify**: Confirm remaining matches are acceptable (e.g., "use pnpm instead of npm")
- **Why**: Ensure full migration

### Task 11.3: Run Final Integration Test
- **File**: N/A (System test)
- **Action**: 
  ```bash
  cd /Matcha
  pnpm install  # Fresh install to verify
  pnpm -C backend run dev &
  pnpm -C frontend run dev &
  sleep 10
  curl -s http://localhost:5000 && echo "Backend OK"
  curl -s http://localhost:3000 | head -5 && echo "Frontend OK"
  ```
- **Expected**: Both servers run, both respond
- **Verify**: OK messages appear
- **Why**: Final confirmation before declaring done

---

## Rollback Plan (If Needed)

If something breaks during migration:

1. **Stop Docker**: `docker compose down`
2. **Revert git changes**: `git checkout HEAD~1` (or specific commit)
3. **Reinstall npm deps**: `npm install` in both backend and frontend
4. **Restart Docker**: `docker compose up -d`

This puts you back to the pre-migration state.

---

## Success Criteria

Migration is complete when:
- [x] pnpm-workspace.yaml exists at root
- [x] Both .npmrc files exist (root and optional per-package)
- [x] Both pnpm-lock.yaml files exist
- [x] Both Dockerfiles reference pnpm commands (zero npm references in install/run)
- [x] docker-compose.yml builds and runs all services
- [x] Backend and frontend dev servers start and respond to HTTP
- [x] All tests pass (if any exist)
- [x] No errors in container logs
- [x] README.md reflects pnpm workflow
- [x] Old package-lock.json files deleted
- [x] Git history shows clean migration commit

---

## Notes

- **Shamefully-hoist**: Setting this to true in .npmrc makes pnpm behave like npm (flat node_modules). This is easier for Docker but loses some of pnpm's strictness benefits. Future improvement: use pnpm store mounting for full strictness.
- **Frozen Lockfile**: `--frozen-lockfile` flag prevents accidental updates in Docker. This is production-best-practice.
- **Monorepo**: With pnpm-workspace.yaml, both packages are coordinated. Future: consider shared root scripts for linting all packages at once.
- **Performance**: After migration, expect 30-50% faster `pnpm install` compared to `npm install`, especially on repeated builds.

---

## Execution Order

1. **Don't skip Phase 1**: Local setup must be done before Docker changes
2. **Test Phase 2 before Docker**: Verify local pnpm works
3. **Phases 3-4 can be parallel**: Update both Dockerfiles simultaneously
4. **Phase 9 is critical**: Full Docker test before declaring done
5. **Phase 10 is optional**: Recommended for high-confidence systems
6. **Phase 11 cleanup**: Final verification and housekeeping

---

**Plan created**: 2026-04-30  
**Next step**: Use `/start-work pnpm-migration` to begin execution
