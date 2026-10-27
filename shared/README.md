# @kodxcamp/shared

> **Shared TypeScript contracts, domain interfaces, and permissions for KodxCamp.**

This package defines the single source of truth for types and domain models shared between `@kodxcamp/client` and `@kodxcamp/server`.

---

## Contents

- **`types/user.ts`**: `IUser`, `UserRole` (`'student' | 'instructor' | 'admin'`), user account statuses.
- **`types/permissions.ts`**: Global platform permissions (`GlobalPermission`), `GLOBAL_PERMISSIONS` array, and course team roles (`'lead' | 'author' | 'reviewer' | 'ta' | 'viewer'`).
- **`types/course.ts`**: `ICourse`, `ILesson`, `ICourseMembership`, pricing models.
- **`types/module.ts`**: Module structures, sections, and items (`IModuleWithSections`).
- **`types/curriculum.ts`**: Unified curriculum activity items (`ICourseCurriculum`, `ISectionWithItems`).
- **`types/problem.ts`**: `IProblem`, test cases, difficulty levels (`'easy' | 'medium' | 'hard'`), and output modes (`'return' | 'print'`).
- **`types/project.ts`**: `IProject`, multi-file project specifications, starter templates, and test configurations.
- **`types/cohort.ts`**: `ICohort`, cohort members, invitations, and permissions.
- **`types/notification.ts`**: Platform notifications, delivery channels, and preferences.
- **`types/media.ts`**: Stored media assets and Cloudinary references.
- **`types/instructorEvaluation.ts`**: Instructor feedback scores and project submission reviews.
- **`constants.ts`**: Shared platform constants.

---

## Building

Compile TypeScript interfaces to JavaScript and `.d.ts` declaration maps:

```powershell
npm run build -w shared
```

The output compiles to `dist/index.js` and `dist/index.d.ts`. Both `@kodxcamp/client` and `@kodxcamp/server` import from `@kodxcamp/shared` via workspace resolution.

