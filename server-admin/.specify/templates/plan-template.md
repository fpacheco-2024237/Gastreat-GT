# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Node.js 18+, Express 5, MongoDB/Mongoose or NEEDS CLARIFICATION]

**Primary Dependencies**: [e.g., express, mongoose, express-validator, multer, cloudinary or NEEDS CLARIFICATION]

**Storage**: [if applicable, e.g., MongoDB, Cloudinary, files or N/A]

**Testing**: [e.g., manual API checks, unit tests or NEEDS CLARIFICATION]

**Target Platform**: [e.g., Linux server, Node.js runtime or NEEDS CLARIFICATION]

**Project Type**: [e.g., web-service or NEEDS CLARIFICATION]

**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]

**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]

**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- The feature MUST stay within the auth-service boundary; no new auth, login, registration, password, or role-management logic.
- Every new resource MUST be scoped by restaurantId and MUST reuse the existing restaurant activation guard instead of introducing a duplicate check.
- Menu and inventory changes MUST preserve consistency between product availability and ingredient stock, with non-negative stock and price rules.
- The feature MUST follow the shared response envelope { success, message, data } and the existing status-code contract.
- New upload, validation, or error-handling work MUST reuse the shared middleware and error-handler modules.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── models/
├── services/
├── controllers/
└── routes/

tests/
├── contract/
├── integration/
└── unit/
```

**Structure Decision**: [Document the selected structure and reference the real directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
