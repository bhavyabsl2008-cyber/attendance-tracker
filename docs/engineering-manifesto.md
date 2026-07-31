# Engineering Manifesto

## Philosophy

Write software that is easy to understand, easy to extend, and difficult to break.

The best code is not the shortest.

The best code is the code another developer can understand six months later.

---

# Core Principles

## Clarity over Cleverness

Readable code always beats clever code.

If a solution requires explaining, consider simplifying it.

---

## Simplicity over Complexity

Solve today's problem.

Avoid building abstractions for hypothetical future requirements.

---

## Composition over Inheritance

Build small reusable pieces.

Compose them into larger systems.

---

## Single Responsibility

Every module, component and function should have one clear purpose.

---

## Pure Functions First

Business logic should be deterministic.

Given the same input, it should always produce the same output.

---

## Separation of Concerns

UI displays information.

Domain logic makes decisions.

Services communicate with external systems.

Each layer has a single responsibility.

---

## Consistency

The same problem should be solved the same way throughout the codebase.

Avoid introducing multiple patterns for identical tasks.

---

# Code Standards

Use meaningful names.

Avoid magic numbers.

Prefer explicit code over implicit behavior.

Delete unused code.

Avoid duplicate logic.

Keep files focused.

---

# Components

Components should:

- do one thing well
- accept clear props
- remain reusable
- avoid embedded business logic

---

# Business Logic

Attendance calculations belong only in the domain layer.

Never duplicate calculations.

Never calculate attendance inside UI components.

---

# Error Handling

Fail clearly.

Return useful error messages.

Never silently ignore failures.

---

# Performance

Measure first.

Optimize second.

Premature optimization increases complexity.

---

# Documentation

Code explains implementation.

Documentation explains intent.

Keep both synchronized.

---

# Pull Request Checklist

Before merging:

- Does this improve readability?
- Does it introduce duplicate logic?
- Does it respect the architecture?
- Is the documentation still correct?
- Would a new contributor understand it?

If any answer is "no", revise before merging.