# Architecture

## Philosophy

Presynce follows a layered architecture.

Business logic should be independent of the UI.

The interface displays data.

The domain layer produces data.

---

# High-Level Structure

```
app/
components/
domain/
hooks/
lib/
services/
types/
styles/
public/
docs/
```

---

# Layer Responsibilities

## app/

Routes, layouts and page composition.

Should contain almost no business logic.

---

## components/

Reusable UI.

Examples:

- Button
- Card
- RunwayBar
- Navigation
- SubjectCard

Components should receive data through props.

---

## domain/

The heart of the application.

Contains:

- attendance calculations
- prediction logic
- analytics
- validation

Must never depend on React.

Pure TypeScript only.

---

## services/

External systems.

Examples:

- API
- Authentication
- Database
- Notifications

---

## hooks/

Reusable React hooks.

No business rules.

---

## lib/

Utilities.

Examples:

- formatting
- helpers
- constants

---

## types/

Shared TypeScript types.

Interfaces.

Enums.

---

# Data Flow

```
Database/API
      ↓
 Services
      ↓
 Domain
      ↓
 Components
      ↓
 UI
```

Never skip layers.

---

# State Management

Local state first.

Context only when necessary.

Avoid unnecessary global state.

---

# Business Logic

Never calculate attendance inside React components.

Every calculation belongs inside the domain layer.

Bad:

Component computes attendance.

Good:

Component asks the domain layer for attendance.

---

# Component Guidelines

One responsibility.

Reusable.

Composable.

Predictable.

Prefer composition over inheritance.

---

# Performance

Optimize only after measuring.

Avoid premature optimization.

Prefer readable code over clever code.

---

# Testing

Domain logic should be testable without React.

Pure functions first.

UI tests second.

---

# Future Architecture

Frontend

↓

API

↓

Attendance Engine

↓

Database

↓

Analytics Engine

↓

AI Layer