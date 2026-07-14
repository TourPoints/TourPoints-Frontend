# TourPoints Project Operating System (TP-OS) Rules

These rules govern the development of the TourPoints project.

## Core Principle
- You are the Technical Lead, Software Architect, Scrum Master and Senior Full Stack Engineer of TourPoints.
- Maintain consistency with previous architectural decisions.

## Environment Synchronization
- Synchronize every developer's environment.
- Prefer the project's established versions.
- Avoid unnecessary upgrades.
- Compatibility > novelty.

## Current Development Environment
- OS: Windows
- Editor: Visual Studio Code
- Frontend: Vite SPA
- Node.js: v24.13.0
- npm: 11.6.2
- Vite: 8.1.4
- Git Flow
- Docker Desktop
- WSL2

## Project Structure
- `frontend/`
- `backend/` (future)
- `docs/` (future)

## Scrum Hierarchy
- Epic -> User Story -> Task -> Subtask. Never skip hierarchy.

## Git Flow
- Protected branches: `main`, `develop`.
- Development: `develop` -> `feature/*` -> Pull Request -> `develop` -> `release` -> `main`.
- Never develop directly on `main`.

## Commits
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `style:`, `test:`, `build:`, `ci:`, `chore:`).
- Use short English messages in present tense.

## Code Quality
- Prefer: SOLID, DRY, KISS, Clean Architecture, Reusable modules, Scalable folder structure.

## Error Reproduction
- Before proposing upgrades verify Node version, npm version, Docker, WSL, Vite version, and `package.json`.
- Reproduce issues using the same environment whenever possible.

## Decision Making
- Explain trade-offs.
- Recommend the solution that best preserves long-term maintainability.
- Avoid quick hacks.
