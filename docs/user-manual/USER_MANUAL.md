# FlowMind User Manual

> **FlowMind - Focus. Flow. Achieve.**
>
> An intelligent productivity workspace for tasks, habits, focus sessions, scheduling, analytics, wellbeing, and explainable AI guidance.

## Table of Contents

- [FlowMind User Manual](#flowmind-user-manual)
  - [Table of Contents](#table-of-contents)
  - [1. Introduction](#1-introduction)
    - [Main capabilities](#main-capabilities)
  - [2. System Requirements](#2-system-requirements)
  - [3. Local Installation](#3-local-installation)
    - [3.1 Clone the repository](#31-clone-the-repository)
    - [3.2 Configure PostgreSQL](#32-configure-postgresql)
    - [3.3 Configure the backend](#33-configure-the-backend)
    - [3.4 Start the backend](#34-start-the-backend)
    - [3.5 Configure the frontend](#35-configure-the-frontend)
    - [3.6 Start the frontend](#36-start-the-frontend)
  - [4. First-Time Account Setup](#4-first-time-account-setup)
    - [Register](#register)
    - [Sign in](#sign-in)
    - [Forgot password](#forgot-password)
  - [5. Understanding the Workspace](#5-understanding-the-workspace)
    - [Desktop navigation](#desktop-navigation)
    - [Mobile navigation](#mobile-navigation)
    - [Customizing visible features](#customizing-visible-features)
  - [6. Dashboard](#6-dashboard)
  - [7. Tasks](#7-tasks)
    - [Typical task workflow](#typical-task-workflow)
    - [Task organization](#task-organization)
    - [Task reminders](#task-reminders)
  - [8. AI Task-Risk Prediction](#8-ai-task-risk-prediction)
  - [9. Habits](#9-habits)
    - [Basic workflow](#basic-workflow)
  - [10. Focus Sessions](#10-focus-sessions)
    - [Starting a session](#starting-a-session)
    - [Session reflection](#session-reflection)
  - [11. Schedule and Smart Scheduling](#11-schedule-and-smart-scheduling)
    - [Smart Scheduling workflow](#smart-scheduling-workflow)
  - [12. Goals \& Targets](#12-goals--targets)
  - [13. Time Budget](#13-time-budget)
  - [14. Time Tracking](#14-time-tracking)
  - [15. Work Categories](#15-work-categories)
  - [16. If-Then Planner](#16-if-then-planner)
  - [17. Start Small](#17-start-small)
  - [18. Analytics](#18-analytics)
  - [19. Productivity Score](#19-productivity-score)
  - [20. Deep Work](#20-deep-work)
  - [21. Productivity Heatmap](#21-productivity-heatmap)
  - [22. Weekly Review](#22-weekly-review)
  - [23. AI Weekly Coach](#23-ai-weekly-coach)
  - [24. Recommendations](#24-recommendations)
  - [25. Personal Patterns](#25-personal-patterns)
  - [26. Activity Timeline](#26-activity-timeline)
  - [27. Life Balance](#27-life-balance)
  - [28. Movement](#28-movement)
  - [29. Energy Check-In](#29-energy-check-in)
  - [30. Sleep](#30-sleep)
  - [31. Cognitive Load](#31-cognitive-load)
  - [32. Workload Warning](#32-workload-warning)
  - [33. Hydration \& Meals](#33-hydration--meals)
  - [34. Recovery Breaks](#34-recovery-breaks)
  - [35. Eye Care](#35-eye-care)
  - [36. Distraction Log](#36-distraction-log)
  - [37. Habit Breaker](#37-habit-breaker)
  - [38. Productivity Experiments](#38-productivity-experiments)
  - [39. Settings](#39-settings)
    - [Personal information](#personal-information)
    - [Timezone](#timezone)
    - [Daily focus goal](#daily-focus-goal)
    - [Week start](#week-start)
    - [Notifications](#notifications)
    - [Dashboard preferences](#dashboard-preferences)
    - [Workspace features](#workspace-features)
    - [Test notification](#test-notification)
  - [40. Browser Notifications](#40-browser-notifications)
  - [41. Light and Dark Themes](#41-light-and-dark-themes)
  - [42. Installing FlowMind as a PWA](#42-installing-flowmind-as-a-pwa)
    - [Desktop](#desktop)
    - [Mobile](#mobile)
  - [43. Recommended Daily Workflow](#43-recommended-daily-workflow)
  - [44. Data and Security Notes](#44-data-and-security-notes)
  - [45. AI and Wellbeing Limitations](#45-ai-and-wellbeing-limitations)
    - [AI predictions](#ai-predictions)
    - [Recommendations](#recommendations)
    - [Wellbeing features](#wellbeing-features)
  - [46. Troubleshooting](#46-troubleshooting)
    - [Frontend cannot connect to the backend](#frontend-cannot-connect-to-the-backend)
    - [Database connection fails](#database-connection-fails)
    - [Registration works but verification email does not arrive](#registration-works-but-verification-email-does-not-arrive)
    - [Password reset email does not arrive](#password-reset-email-does-not-arrive)
    - [Browser notification does not appear](#browser-notification-does-not-appear)
    - [A feature is missing from the sidebar](#a-feature-is-missing-from-the-sidebar)
    - [Mobile navigation does not show every tool](#mobile-navigation-does-not-show-every-tool)
    - [AI insights are limited](#ai-insights-are-limited)
  - [47. Quick Feature Reference](#47-quick-feature-reference)
  - [48. Useful Local Addresses](#48-useful-local-addresses)
  - [49. Project Purpose](#49-project-purpose)
  - [50. Support and Repository](#50-support-and-repository)

## 1. Introduction

FlowMind is an AI-powered productivity and personal management platform designed to help users organize work, build consistent routines, protect focus, plan time realistically, and understand productivity patterns.

The application combines everyday productivity tools with explainable recommendations and a trained task-risk prediction model. It is designed as one connected workspace rather than a collection of unrelated tools.

### Main capabilities

- Secure user registration, email verification, login, logout, and password recovery
- Task management with organization, reminders, analytics, calendar tools, and task-risk insights
- Habit tracking with progress and streak information
- Focus sessions with timer controls, history, goals, and reflections
- Calendar and Smart Scheduling
- Productivity scoring and analytics
- Explainable recommendations and AI coaching
- Goal setting, time budgeting, and time tracking
- Activity timeline and weekly review
- Personal productivity pattern analysis
- Energy, sleep, cognitive load, movement, recovery, and life-balance tools
- Distraction management and productivity experiments
- Browser notifications
- Light and dark themes
- Responsive desktop and mobile layouts
- Installable Progressive Web App experience

---

## 2. System Requirements

For local use, the project requires:

- Windows, macOS, or Linux
- Node.js and npm
- Python 3.12 or a compatible Python version
- PostgreSQL
- A modern browser such as Chrome, Edge, Firefox, or Safari

The project uses:

- Next.js for the frontend
- FastAPI for the backend
- PostgreSQL for persistent data
- SQLAlchemy for database access
- Scikit-learn and related Python libraries for machine learning
- Browser APIs for notifications and PWA functionality

---

## 3. Local Installation

### 3.1 Clone the repository

```bash
git clone https://github.com/Asas-Ahmed/flowmind.git
cd flowmind
```

### 3.2 Configure PostgreSQL

Create a PostgreSQL database for FlowMind.

Example database name:

```text
flowmind
```

### 3.3 Configure the backend

Move into the backend folder:

```bash
cd backend
```

Create and activate a Python virtual environment.

Windows:

```bash
python -m venv .venv
.venv\Scripts\activate
```

macOS or Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`.

Example:

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

Replace the PostgreSQL username, password, and secret values with your own configuration.

The Resend values are required for real email verification and password recovery emails.

### 3.4 Start the backend

From the `backend` folder:

```bash
uvicorn app.main:app --reload
```

The backend is normally available at:

```text
http://localhost:8000
```

FastAPI interactive API documentation is available at:

```text
http://localhost:8000/docs
```

A health endpoint is available at:

```text
http://localhost:8000/api/health
```

### 3.5 Configure the frontend

Open another terminal and move into the frontend folder:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

If needed, create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3.6 Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 4. First-Time Account Setup

### Register

1. Open the FlowMind landing page.
2. Choose the registration option.
3. Enter your full name, email address, and password.
4. Submit the registration form.
5. Complete email verification using the verification link sent to your email account.
6. Return to FlowMind and sign in.

FlowMind requires email verification before normal account access.

### Sign in

1. Open the login page.
2. Enter the verified email address and password.
3. Select the login button.
4. FlowMind opens the Dashboard after successful authentication.

### Forgot password

1. Open the login page.
2. Select the forgot-password option.
3. Enter the account email address.
4. Open the password reset email.
5. Use the secure reset link.
6. Set a new password.
7. Return to the login page and sign in.

Password reset links are time-limited and are designed for one-time use.

---

## 5. Understanding the Workspace

### Desktop navigation

On desktop, FlowMind uses a grouped sidebar.

The main groups are:

- Everyday
- Plan & Organize
- Insights & Coaching
- Energy & Wellbeing
- Improve & Experiment
- Account

Expandable groups keep the interface organized even though FlowMind contains many tools.

### Mobile navigation

On mobile, the main navigation contains:

- Home
- Tasks
- Habits
- Focus
- Explore

Select **Explore** to access the remaining FlowMind tools in a mobile-friendly menu.

### Customizing visible features

FlowMind allows optional workspace features to be hidden from navigation.

Go to:

```text
Settings -> Workspace features
```

Use the feature toggles to keep only the tools you want to see.

Dashboard and Settings remain available because they are core workspace controls.

---

## 6. Dashboard

The Dashboard is the main FlowMind overview.

It brings together information from the user's productivity activity and can include:

- Task status
- Habit progress
- Focus activity
- Schedule information
- Productivity score
- Weekly trends
- Priority actions
- Overdue work
- Assistant insights
- Performance balance information

Use the Dashboard as the starting point for a daily review.

A recommended daily workflow is:

1. Open Dashboard.
2. Review priority work.
3. Check today's habits.
4. Review scheduled events.
5. Start a focus session.
6. Return later to review progress and recommendations.

---

## 7. Tasks

The Tasks workspace is used to capture, organize, prioritize, and complete work.

### Typical task workflow

1. Open **Tasks**.
2. Create a task.
3. Add useful information such as priority, category, due date, estimated duration, or organizational details.
4. Save the task.
5. Review it in the available task views.
6. Update the status as work progresses.
7. Complete or delete the task when appropriate.

### Task organization

FlowMind supports task organization using features such as:

- Lists
- Categories
- Tags
- Search
- Sorting
- Filters
- Favorites
- Recurring task support
- Calendar-oriented task views
- Eisenhower-style prioritization
- Task import and export

### Task reminders

Task reminders can use browser notifications when notification permission is granted.

Make sure:

- Browser notifications are enabled
- Task reminders are enabled in Settings
- The browser or installed PWA is allowed to send notifications

---

## 8. AI Task-Risk Prediction

FlowMind includes a trained V4 machine learning task-risk model.

The model estimates the risk associated with task completion using relevant productivity and behavioural signals.

Depending on available data, the interface can present:

- Completion probability
- Risk level
- Important contributing factors
- Explainable recommendations

The purpose of the prediction is decision support. It is not a guarantee that a task will or will not be completed.

Use task-risk information to identify work that may benefit from:

- Earlier scheduling
- Reduced workload
- A smaller first step
- A focus session
- More realistic time allocation
- Deadline attention

FlowMind combines machine learning predictions with explainable recommendation logic instead of presenting an unexplained score alone.

---

## 9. Habits

The Habits workspace helps users build and maintain routines.

### Basic workflow

1. Open **Habits**.
2. Create a habit.
3. Configure its target and schedule.
4. Save it.
5. Record daily completion.
6. Review progress, history, and consistency.

Habit data contributes to the broader productivity picture shown across FlowMind.

---

## 10. Focus Sessions

The Focus workspace provides Pomodoro-style focused work sessions.

### Starting a session

1. Open **Focus**.
2. Choose the desired focus duration or available session option.
3. Start the session.
4. Pause and resume when necessary.
5. Complete the session when finished.

### Session reflection

After a session, FlowMind can store:

- Session notes
- Experience or focus-quality reflection
- Duration and history information

The Focus workspace also supports:

- Daily focus goals
- Session statistics
- Focus history
- Adaptive focus recommendations

Focus activity contributes to analytics, productivity scoring, personal patterns, and other insights.

---

## 11. Schedule and Smart Scheduling

The Schedule workspace is FlowMind's calendar and time-planning area.

Users can:

- Create schedule events
- Edit events
- Delete events
- Review calendar periods
- Organize task-linked time blocks
- Use Smart Scheduling suggestions

### Smart Scheduling workflow

1. Create tasks with realistic priorities, deadlines, and estimated durations.
2. Open **Schedule**.
3. Open the Smart Scheduling function.
4. Review generated scheduling suggestions.
5. Select the suggestions you want.
6. Apply them to the calendar.
7. Adjust the schedule manually when needed.

Smart Scheduling considers information such as:

- Deadlines
- Priority
- Estimated effort
- Work-hour preferences
- Existing calendar conflicts
- Break buffers
- Task-risk information where applicable

Always review generated suggestions before relying on them as a final plan.

---

## 12. Goals & Targets

Use **Goals & Targets** to define weekly productivity outcomes.

Goals help users move from general intention to measurable progress.

Typical uses include:

- Weekly task targets
- Focus targets
- Productivity goals
- Progress review

---

## 13. Time Budget

The Time Budget workspace helps users decide how much time should be allocated across different areas before the week becomes overcommitted.

Use it to:

- Plan weekly time allocation
- Compare intended time with actual activity
- Identify overloaded categories
- Support more realistic scheduling decisions

---

## 14. Time Tracking

The Time Tracking workspace records where time is actually spent.

Users can:

- Start tracked work
- Create manual time entries
- Organize work by projects or categories
- Review tracked activity
- Compare actual time usage with plans

Time-tracking information also supports analytics and reflection.

---

## 15. Work Categories

Work Categories allow the user to organize different areas of activity.

Examples might include:

- Study
- Project work
- Personal tasks
- Administration
- Exercise

Use categories consistently to make analytics and time reports more meaningful.

---

## 16. If-Then Planner

The If-Then Planner supports implementation intentions.

The general structure is:

```text
If a specific obstacle or situation occurs, then I will perform a planned response.
```

Example:

```text
If I feel like postponing my report, then I will work on it for five minutes.
```

The purpose is to prepare a response before the obstacle occurs.

---

## 17. Start Small

The **Start Small** workspace is designed for task-initiation difficulty.

Use it when a task feels too large or difficult to begin.

The feature helps turn an intimidating task into a smaller first action and can support guided anti-procrastination strategies.

---

## 18. Analytics

The Analytics workspace is the central location for productivity insights.

It brings together information generated across FlowMind rather than requiring the user to inspect every workspace separately.

Use Analytics to review:

- Productivity performance
- Work patterns
- Focus behaviour
- Consistency
- Historical trends

Analytics become more meaningful as more real activity is recorded.

---

## 19. Productivity Score

The Productivity workspace presents FlowMind's Smart Productivity Score and supporting information.

The score is intended as an interpretable productivity indicator based on available FlowMind activity.

It should be used as a trend and reflection tool rather than as a measure of personal worth or ability.

---

## 20. Deep Work

Deep Work analytics help users understand the quality and pattern of focused work.

Use this area to review focus behaviour and identify when productive concentration tends to occur.

---

## 21. Productivity Heatmap

The Productivity Heatmap provides a long-term consistency view inspired by contribution-style activity grids.

It is useful for spotting:

- Productive periods
- Gaps in consistency
- Long-term activity trends

---

## 22. Weekly Review

The Weekly Review workspace helps the user reflect on recent activity and reset for the next week.

Use it to review:

- Completed work
- Focus activity
- Habit consistency
- Productivity trends
- Areas that need adjustment

---

## 23. AI Weekly Coach

The AI Weekly Coach provides an explainable summary of recent productivity information.

Its purpose is to convert weekly data into practical coaching guidance.

Use coaching recommendations as suggestions, then decide whether they fit your real circumstances.

---

## 24. Recommendations

The Recommendations workspace presents explainable suggested actions based on available FlowMind data.

Recommendations may connect information from:

- Tasks
- Scheduling
- Focus
- Habits
- Productivity
- Workload
- Wellbeing signals
- Task-risk prediction

The system is designed to explain why an action is suggested rather than presenting unexplained advice.

---

## 25. Personal Patterns

Personal Patterns helps users discover recurring productivity behaviour.

As sufficient activity accumulates, the workspace can help identify patterns in how the user works best.

This feature is most useful after FlowMind has been used consistently for a period of time.

---

## 26. Activity Timeline

The Activity Timeline provides a unified view of recent productivity activity.

Use it to review what happened across FlowMind without opening every individual workspace.

---

## 27. Life Balance

Life Balance helps the user review important life areas together rather than optimizing only task completion.

Use it as a reflection tool for sustainable productivity and balanced planning.

---

## 28. Movement

The Movement workspace supports healthy movement breaks during work periods.

Users can record movement activity and review movement-related statistics.

Movement reminders are designed to complement focus sessions and long periods of desk work.

---

## 29. Energy Check-In

Energy Check-In allows users to record current productivity-related state information such as:

- Energy
- Stress
- Focus

This information can support adaptive productivity recommendations.

---

## 30. Sleep

The Sleep workspace tracks sleep regularity and related patterns.

Users can record:

- Bedtime
- Wake time
- Calculated sleep duration
- Sleep quality

FlowMind uses this information for productivity-oriented insights.

This feature is not intended for medical diagnosis.

---

## 31. Cognitive Load

Cognitive Load helps users notice periods of high mental demand.

Use it as a productivity reflection tool when deciding whether to:

- Continue demanding work
- Switch task type
- Reduce workload
- Take a recovery break

It is not a medical assessment tool.

---

## 32. Workload Warning

The Workload Warning workspace combines productivity signals to identify potentially unsustainable workload patterns.

It can use information from areas such as:

- Tasks
- Focus sessions
- Energy check-ins
- Sleep regularity
- Cognitive load

The feature provides productivity and wellbeing guidance only.

It does not provide medical diagnosis.

---

## 33. Hydration & Meals

The Hydration & Meals workspace supports simple nourishment awareness during productive work.

Use it to record relevant daily information and encourage more sustainable work routines.

---

## 34. Recovery Breaks

Recovery Breaks provides guided short breaks that can be used between periods of concentrated work.

Use this feature when you need a deliberate reset before returning to a task.

---

## 35. Eye Care

Eye Care supports the 20-20-20 practice.

A typical cycle encourages the user to periodically look away from the screen toward something farther away for a short break.

The workspace includes timer-based guidance and browser notifications where supported.

---

## 36. Distraction Log

The Distraction Log records interruptions and distraction patterns.

Use it to identify:

- Common distraction types
- Repeated interruption periods
- Situations that reduce focus

The goal is to turn vague distraction problems into observable patterns that can be addressed.

---

## 37. Habit Breaker

Habit Breaker is a specialized behaviour-change workspace for tracking recovery from unwanted habits.

It includes journey, reset, and reward-oriented functionality.

Use it as a self-management tool rather than a clinical treatment system.

---

## 38. Productivity Experiments

The Experiments workspace supports personal productivity experiments.

Users can test different approaches and compare results instead of assuming one method works best.

Example ideas include:

- Different focus-session durations
- Morning versus evening deep work
- Different break structures
- Alternative planning methods

Keep experiments simple enough that the result can be interpreted.

---

## 39. Settings

The Settings workspace controls account and productivity preferences.

### Personal information

Users can update the name displayed in FlowMind.

### Timezone

Choose the correct timezone so schedule and reminder behaviour matches local time.

### Daily focus goal

Set a daily focus target that matches a realistic working routine.

### Week start

Select the preferred week-start convention where available.

### Notifications

Available preferences include:

- Email notifications
- Task reminders
- Habit reminders
- Weekly summary

### Dashboard preferences

Users can configure dashboard-related preferences such as compact presentation where available.

### Workspace features

Optional features can be shown or hidden from navigation.

Use this when you want a simpler workspace with fewer tools visible.

### Test notification

Settings includes a **Send test notification** button.

Use it to verify that browser notification permission is working on the current device.

If the test does not appear:

1. Check browser notification permission.
2. Allow notifications for the FlowMind site.
3. Retry the test notification.

---

## 40. Browser Notifications

FlowMind uses browser notification capabilities for relevant reminders.

When the browser asks for permission:

- Choose **Allow** if you want FlowMind reminders.
- Choose **Block** if you do not want browser notifications.

If permission was previously blocked, change it through the browser's site settings.

Notification availability depends on the browser, operating system, and device settings.

---

## 41. Light and Dark Themes

FlowMind supports light and dark visual themes.

Use the theme control in the interface to switch between available appearance modes.

The selected theme is intended to remain consistent across the workspace.

---

## 42. Installing FlowMind as a PWA

FlowMind includes Progressive Web App support.

On supported browsers, the application can be installed so it behaves more like a standalone desktop or mobile application.

### Desktop

1. Open FlowMind in a supported browser.
2. Look for the browser's install-app option.
3. Select **Install**.
4. Launch FlowMind from the operating system like another application.

### Mobile

1. Open FlowMind in the mobile browser.
2. Open the browser menu or share menu.
3. Choose the available install or add-to-home-screen option.
4. Launch FlowMind from the new home-screen icon.

PWA installation options vary by browser and operating system.

---

## 43. Recommended Daily Workflow

A simple way to use FlowMind is:

1. Open Dashboard.
2. Review today's tasks and schedule.
3. Check or create the most important tasks.
4. Use task-risk insights to identify vulnerable work.
5. Apply Smart Scheduling if the day needs structure.
6. Start a Focus session.
7. Record habit progress.
8. Add relevant energy or wellbeing check-ins.
9. Review recommendations later in the day.
10. Use Weekly Review and AI Weekly Coach at the end of the week.

You do not need to use every FlowMind feature. Hide optional tools in Settings if you prefer a simpler workspace.

---

## 44. Data and Security Notes

FlowMind includes:

- Protected authenticated routes
- JWT-based authentication
- HTTP-only cookie handling for frontend authentication flow
- Refresh-token support
- Password hashing
- Email verification
- Time-limited password reset tokens
- Validation and rate-limiting protections in authentication flows

Users should still follow normal security practices:

- Use a strong password
- Do not share account credentials
- Protect access to the email account used for verification
- Use trusted devices where possible
- Do not commit real `.env` secrets to GitHub

---

## 45. AI and Wellbeing Limitations

FlowMind contains intelligent productivity features, but users should understand their scope.

### AI predictions

Task-risk predictions are probabilistic and can be wrong. They should support planning decisions rather than replace user judgment.

### Recommendations

Recommendations are generated from available FlowMind information. If activity data is incomplete, recommendations may be less useful.

### Wellbeing features

Energy, sleep, cognitive load, workload warning, movement, nourishment, life balance, and recovery tools are productivity-oriented self-management features.

They are not medical or diagnostic services.

---

## 46. Troubleshooting

### Frontend cannot connect to the backend

Check that:

- The FastAPI server is running on `http://localhost:8000`
- `NEXT_PUBLIC_API_URL` points to the correct backend address
- The frontend is running on `http://localhost:3000`
- The browser is not blocking the request

### Database connection fails

Check:

- PostgreSQL is running
- The database exists
- The database username and password are correct
- `DATABASE_URL` is correct

### Registration works but verification email does not arrive

Check:

- `RESEND_API_KEY` is valid
- `EMAIL_FROM` is valid for the Resend configuration
- The recipient address is permitted by the current Resend account or domain configuration
- Spam or junk folders

### Password reset email does not arrive

Check the same email configuration used for verification.

### Browser notification does not appear

1. Open **Settings** in FlowMind.
2. Select **Send test notification**.
3. Allow permission if prompted.
4. If blocked, open the browser's site settings and enable notifications.

### A feature is missing from the sidebar

Open **Settings** and review Workspace Features. The feature may have been hidden.

### Mobile navigation does not show every tool

Select **Explore**. The mobile bottom navigation intentionally keeps only the main daily tools visible.

### AI insights are limited

Add real productivity activity first. Features such as tasks, focus sessions, habits, schedules, check-ins, and time tracking give FlowMind more context for useful insights.

---

## 47. Quick Feature Reference

| Group | Features |
| --- | --- |
| Everyday | Dashboard, Tasks, Habits, Focus, Schedule |
| Plan & Organize | Goals & Targets, Time Budget, Time Tracking, Work Categories, If-Then Planner, Start Small |
| Insights & Coaching | Analytics, Productivity, Deep Work, Productivity Heatmap, Weekly Review, AI Weekly Coach, Recommendations, Personal Patterns, Activity Timeline |
| Energy & Wellbeing | Life Balance, Movement, Energy Check-In, Sleep, Cognitive Load, Workload Warning, Hydration & Meals, Recovery Breaks, Eye Care |
| Improve & Experiment | Distraction Log, Habit Breaker, Experiments |
| Account | Settings |

---

## 48. Useful Local Addresses

| Service | Address |
| --- | --- |
| FlowMind frontend | `http://localhost:3000` |
| FlowMind API | `http://localhost:8000` |
| API documentation | `http://localhost:8000/docs` |
| API health check | `http://localhost:8000/api/health` |

---

## 49. Project Purpose

FlowMind was developed as a final-year Software Engineering project exploring an integrated approach to productivity management.

The project combines:

- Full-stack software engineering
- Productivity tracking
- Scheduling
- Explainable recommendation logic
- Machine learning task-risk prediction
- Behavioural productivity tools
- Analytics
- Responsive web and PWA design

The system is intended to demonstrate how productivity data from multiple areas can be brought together to support more adaptive and explainable planning.

---

## 50. Support and Repository

GitHub repository:

```text
https://github.com/Asas-Ahmed/flowmind
```

For source code, project documentation, release information, and future updates, use the repository above.

---

**FlowMind - Focus. Flow. Achieve.**
