# Idea Incubator — Validation Schemas (Zod)

Shared between server and client via `@repo/shared`.

---

## Shared Patterns

```ts
// packages/shared/src/schemas.ts
import { z } from "zod";

export const cuid = z.string().cuid();
export const email = z.string().email("Invalid email address");
export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const sortBy = z
  .enum(["recent", "alpha", "priority", "status"])
  .default("recent");
```

---

## Auth Schemas

```ts
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
```

---

## Idea Schemas

```ts
export const ideaStatus = z.enum([
  "IDEA",
  "PLANNING",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "ARCHIVED",
]);
export const ideaPriority = z.enum([
  "NONE",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  status: ideaStatus.default("IDEA"),
  priority: ideaPriority.default("NONE"),
  tagIds: z.array(cuid).max(10).optional(),
});

export const updateIdeaSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: ideaStatus.optional(),
  priority: ideaPriority.optional(),
  tagIds: z.array(cuid).max(10).optional(),
});

export const ideaFiltersSchema = pagination.extend({
  status: z.string().optional(), // comma-separated statuses
  priority: ideaPriority.optional(),
  tag: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: sortBy,
});

export const updateStatusSchema = z.object({
  status: ideaStatus,
});
```

---

## Tag Schemas

```ts
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color")
    .optional(),
});

export const updateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});
```

---

## Task Schemas

```ts
export const createTaskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200),
  milestone: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  milestone: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
```

---

## Comment Schemas

```ts
export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});
```

---

## Share Schemas

```ts
export const shareRole = z.enum(["OWNER", "EDIT", "VIEW"]);

export const createShareSchema = z.object({
  email,
  role: shareRole.default("VIEW"),
});

export const updateShareSchema = z.object({
  role: shareRole,
});
```

---

## Planning Schemas

```ts
export const planningSection = z.enum([
  "overview",
  "tech-stack",
  "features",
  "timeline",
  "risks",
]);

export const updatePlanningSchema = z.object({
  content: z.string().max(100_000), // 100KB max for markdown
});
```

---

## Notification Schemas

```ts
export const notificationFilters = z.object({
  unread: z.coerce.boolean().optional(),
});
```

---

## Server-Side Usage

Every route handler validates input:

```ts
// apps/server/src/middleware/validate.ts
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
      });
    }
    req.body = result.data;
    next();
  };
}

// Route usage
router.post("/ideas", validate(createIdeaSchema), createIdea);
```

---

## Client-Side Usage

Forms use `@hookform/zod` resolver:

```tsx
import { zodResolver } from "@hookform/zod/zod";
import { useForm } from "react-hook-form";
import { createIdeaSchema } from "@repo/shared";

function CreateIdeaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createIdeaSchema),
    defaultValues: { status: "IDEA", priority: "NONE" },
  });
  // ...
}
```
