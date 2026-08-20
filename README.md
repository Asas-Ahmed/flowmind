<div align="center">

<img src="frontend/public/brand/flowmind-logo-original.png" alt="FlowMind" width="240" />

# FlowMind

### AI-Powered Adaptive Productivity and Life Management System

**Plan smarter. Focus deeper. Build sustainable productivity.**

FlowMind is a full-stack productivity platform for students and working professionals that combines task management, focus support, habits, intelligent scheduling, time management, productivity analytics, wellbeing-aware tools, explainable recommendations, and machine-learning task-risk prediction in one integrated workspace.

**Stable Release: `v1.0.1`**

</div>

---

## Overview

Modern productivity often requires switching between separate task managers, calendars, focus timers, habit trackers, time trackers, and wellbeing tools. FlowMind was developed to reduce that fragmentation by bringing these capabilities together and adding adaptive, explainable decision support.

The system is implemented as a real full-stack application with a **Next.js frontend**, **FastAPI backend**, **PostgreSQL database**, and an integrated **V4 machine-learning task-risk ensemble**.

<p align="center">
  <img src="docs/assets/readme/landing.png" alt="FlowMind landing page" width="900" />
</p>

---

## Core Capabilities

### Productivity Workspace

- **Task Management** - CRUD, priorities, lists, categories, tags, subtasks, recurring tasks, reminders, favorites, board/list views, search, smart date filters, Eisenhower Matrix, calendar view, analytics, and import/export.
- **Habit Tracking** - recurring habits, check-ins, streaks, progress insights, recovery support, and habit-management analytics.
- **Focus Sessions** - Pomodoro-style sessions, configurable durations, linked tasks, breaks, session history, daily goals, streaks, adaptive focus recommendations, and post-session reflections.
- **Smart Scheduling** - month/week/day/agenda/timeline views, event CRUD, drag-and-drop planning, resizing, reminders, task-linked calendar blocks, conflict awareness, and explainable smart-schedule suggestions.
- **Goals & Time Management** - weekly goals, time tracking, time budgeting, work categories, activity timeline, and productivity planning.
- **Productivity Analytics** - live dashboard, productivity score, analytics hub, deep-work analytics, yearly productivity heatmap, weekly review, and personal-pattern insights.

### Adaptive & AI-Assisted Features

- **V4 Task-Risk Prediction** - predicts the probability that a task will be completed before its deadline.
- **Explainable Risk Levels** - Low, Medium, and High task-risk classifications with contributing factors.
- **Recommendation Engine** - explainable actions based on productivity context.
- **Smart Scheduling** - considers deadlines, priority, estimated effort, workload, planning preferences, and task-risk context.
- **Weekly AI Coach** - summarizes patterns and provides practical productivity guidance.
- **Personal Patterns** - surfaces explainable trends from user activity.

### Wellbeing-Aware Productivity Tools

FlowMind treats wellbeing signals as productivity context rather than medical diagnosis.

- Movement Break Coach
- 20-20-20 Eye Care
- Energy & Mental Fatigue Check-In
- Sleep Regularity
- Cognitive Load
- Distraction Log
- Anti-Procrastination Starter
- If-Then Planner
- Productivity Experiments
- Workload Warning
- Hydration & Meal Awareness
- Guided Recovery Breaks
- Life Balance
- Habit Recovery

### Platform & Account Features

- Secure registration and login
- Email verification
- Password recovery
- JWT access and refresh flow
- httpOnly authentication cookies
- Protected frontend routes and backend endpoints
- User-specific data isolation
- Light and dark themes
- Responsive desktop and mobile interface
- Browser notifications
- Installable Progressive Web App (PWA)
- Customizable workspace feature visibility

---

## Interface Preview

<table>
  <tr>
    <td width="50%" align="center">
      <strong>Dashboard</strong><br><br>
      <img src="docs/assets/readme/dashboard.png" alt="FlowMind Dashboard" />
    </td>
    <td width="50%" align="center">
      <strong>Tasks</strong><br><br>
      <img src="docs/assets/readme/tasks.png" alt="FlowMind Task Workspace" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <strong>Smart Schedule</strong><br><br>
      <img src="docs/assets/readme/schedule.png" alt="FlowMind Schedule Workspace" />
    </td>
    <td width="50%" align="center">
      <strong>Focus Sessions</strong><br><br>
      <img src="docs/assets/readme/focus.png" alt="FlowMind Focus Workspace" />
    </td>
  </tr>
</table>

<p align="center">
  <strong>Analytics</strong><br><br>
  <img src="docs/assets/readme/analytics.png" alt="FlowMind Analytics" width="900" />
</p>

---

## Machine Learning

FlowMind includes a trained and explainable task-risk model that estimates whether a task is likely to be completed before its deadline.

### Final V4 Model

The deployed model is a compact ensemble built from evaluated machine-learning approaches. Its final non-zero blend uses:

- CatBoost
- Logistic Regression
- HistGradientBoosting

The final evaluation used an untouched holdout containing **unseen users**, with **zero user overlap** between training and holdout data.

| Metric | Final Holdout Result |
| --- | ---: |
| Accuracy | **78.89%** |
| Balanced Accuracy | **78.75%** |
| Macro F1 | **77.04%** |
| ROC AUC | **86.69%** |
| Risk Precision | **64.13%** |
| Risk Recall | **78.34%** |
| Risk F1 | **70.53%** |
| Unseen-user overlap | **0** |

The production prediction provides:

```text
Completion Probability
        ↓
Low / Medium / High Risk
        ↓
Explainable Contributing Factors
        ↓
Tasks + Dashboard + Smart Scheduling + Recommendations
```

<p align="center">
  <img src="docs/assets/readme/task-risk.png" alt="FlowMind Task Risk Prediction" width="900" />
</p>

> The model is a productivity decision-support component, not a guarantee of future behaviour. The first model version was developed using a designed synthetic behavioural dataset because sufficient long-term real-user FlowMind data was not available during the project period.

---

## System Architecture

FlowMind follows a **Modular Layered Architecture inspired by Clean Architecture principles**.

```text
User
  ↓
Next.js / React Presentation Layer
  ↓
REST API
  ↓
FastAPI API / Controller Layer
  ↓
Service / Business Logic Layer
  ↓
AI / Analytics / Recommendation Layer
  ↓
Repository Layer
  ↓
SQLAlchemy ORM / Model Layer
  ↓
PostgreSQL Database
```

<p align="center">
  <img src="docs/assets/readme/architecture.png" alt="FlowMind System Architecture" width="900" />
</p>

This separation keeps interface logic, business rules, AI processing, persistence, and database responsibilities maintainable and independently testable.

---

## Technology Stack

| Area | Technologies |
| --- | --- |
| **Frontend** | Next.js 16.3, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide React, next-themes |
| **Backend** | FastAPI, Python 3.12, Pydantic |
| **Database** | PostgreSQL, SQLAlchemy, Psycopg |
| **AI / ML** | Scikit-learn, CatBoost, HistGradientBoosting, Pandas, NumPy |
| **Authentication** | JWT, access/refresh tokens, httpOnly cookies, password hashing |
| **Testing** | Pytest, HTTPX, FastAPI TestClient, Vitest, Playwright, axe-core |
| **Version Control** | Git, GitHub |
| **Development** | Visual Studio Code, npm, pip |

---

## Project Structure

```text
flowmind/
├── frontend/
│   ├── app/                  # Next.js routes and workspaces
│   ├── components/           # Reusable UI and feature components
│   ├── hooks/                # Frontend hooks
│   ├── lib/                  # API client and utilities
│   ├── types/                # TypeScript models
│   └── public/               # Branding and PWA assets
│
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── services/         # Business logic
│   │   ├── repositories/     # Data-access logic
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── ai/               # ML prediction and explainability
│   │   ├── database/         # Database configuration
│   │   └── core/             # Security and application configuration
│   ├── tests/                # Backend automated tests
│   └── requirements.txt
│
├── database/
├── docs/
├── .github/
├── README.md
└── LICENSE
```

---

## Getting Started

### Prerequisites

Install:

- **Node.js**
- **Python 3.12+**
- **PostgreSQL**
- **Git**

### 1. Clone the repository

```bash
git clone https://github.com/Asas-Ahmed/flowmind.git
cd flowmind
```

### 2. Configure the backend

Create and activate a virtual environment, then install dependencies.

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install packages:

```bash
pip install -r requirements.txt
```

Create `backend/.env` using `backend/.env.example` as the template:

```env
DATABASE_URL=postgresql+psycopg://username:password@localhost:5432/flowmind
FRONTEND_URL=http://localhost:3000

SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES=15
EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES=30

RESEND_API_KEY=re_your_api_key
EMAIL_FROM=FlowMind <onboarding@resend.dev>
```

> Never commit real secrets or API keys.

Run the backend:

```bash
uvicorn app.main:app --reload
```

Backend default:

```text
http://localhost:8000
```

### 3. Configure the frontend

Open another terminal:

```bash
cd frontend
npm install
```

FlowMind defaults to:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If a different backend URL is required, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm run dev
```

Frontend default:

```text
http://localhost:3000
```

---

## Testing & Verification

The final development stage included backend, frontend, integration, machine-learning, browser, responsive, accessibility, dependency, build, and user-acceptance testing.

| Verification Area | Result |
| --- | --- |
| Backend automated suite | **121 passed** |
| Backend coverage | **80%** |
| Frontend Vitest | **8 / 8 passed** |
| Dependency audit | **0 vulnerabilities** |
| Production build | **Successful** |
| TypeScript verification | **Successful** |
| User Acceptance Testing | **15 / 15 passed** |
| Browser E2E suite | **122 passed, 43 failed** |
| Cross-browser profiles | Chromium, Firefox, WebKit |
| Mobile profiles | Mobile Chrome, Mobile Safari |
| Accessibility | axe-based checks executed |

The remaining Playwright failures are documented as part of the project evaluation rather than hidden. They primarily form evidence for the known testing limitations and future improvement work.

---

## Progressive Web App

FlowMind can be installed as a standalone Progressive Web App on supported devices and browsers.

<p align="center">
  <img src="docs/assets/readme/pwa.png" alt="FlowMind installed PWA" width="900" />
</p>

The project includes:

- Web app manifest
- Application icons
- Service worker support
- Installable desktop/mobile experience
- Standalone application mode

---

## Research & Evaluation

FlowMind was developed as a final-year Software Engineering project and was supported by:

- Project proposal and feasibility analysis
- Software Requirements Specification
- Literature review
- User research questionnaire
- System architecture and UML/design diagrams
- Desktop and mobile wireframes
- Machine-learning experimentation and unseen-user evaluation
- Automated software testing
- User Acceptance Testing
- Technical, data, research, ethical, and project limitation analysis

The project evaluates FlowMind as a software artefact and decision-support system. It does **not** claim that short-term project evaluation proves long-term improvements in productivity, wellbeing, or behaviour change.

---

## Design Evidence

The project documentation includes:

- System Context Diagram
- Context-Level and Level-0 DFDs
- Intelligent Core Workflow
- Use Case Diagram
- System Architecture Diagram
- Entity Relationship Diagram
- Component Architecture
- Class Diagram
- Activity Diagrams
- Sequence Diagrams
- Desktop and mobile wireframes
- Final UI screenshots
- Testing and UAT evidence

These artefacts are maintained under the project documentation/evidence structure and support the final thesis and demonstration.

---

## Release

### `v1.0.1` - Core Workflow Polish

The current stable release refines the core FlowMind productivity experience, including:

- smart task date filtering;
- task-linked Focus Sessions;
- improved integration between tasks and deep work;
- continuation of previous Time Tracking activities;
- preserved Smart Scheduling, analytics, AI, PWA, and wellbeing functionality.

This release is the stable software artefact prepared for final project evaluation and demonstration.

---

## Important Limitations

- The first ML model is trained using synthetic behavioural data and requires future external validation with anonymised real-user data.
- AI outputs are productivity guidance and are not medical or psychological diagnosis.
- Long-term behaviour-change effectiveness was not established within the project period.
- Browser E2E/accessibility testing identified remaining issues that are documented for future improvement.
- Production-scale load and long-duration field testing remain future work.

---

## Academic Project

**Project:** AI-Powered Adaptive Productivity and Life Management System to Enhance Productivity and Work-Life Balance for Students and Working Professionals

**System:** FlowMind  
**Module:** CIS6035 - Development Project  
**Programme:** BSc (Hons) Software Engineering

---

<div align="center">

### FlowMind

**One workspace for planning, focus, insight, and adaptive productivity support.**

</div>
