# Idea Incubator — Security

## Authentication Flow

### JWT Pattern: Access Token + Rotating Refresh Token

|                     | Access Token                           | Refresh Token                            |
| ------------------- | -------------------------------------- | ---------------------------------------- |
| **Lifetime**        | 15 minutes                             | 30 days                                  |
| **Storage**         | In-memory JS variable                  | HttpOnly, Secure, SameSite=Strict cookie |
| **Algorithm**       | ES256 (via `jose`)                     | ES256 (via `jose`)                       |
| **Sent via**        | `Authorization: Bearer <token>` header | Automatically by browser (cookie)        |
| **Never stored in** | localStorage, sessionStorage           | —                                        |

### Login Flow

1. User submits email + password
2. Server verifies password with bcryptjs
3. Server generates access token (15min) + refresh token (30d)
4. Access token returned in response body
5. Refresh token set as HttpOnly cookie
6. Client stores access token in memory (JS variable)
7. Client Axios interceptor attaches access token to all requests

### Refresh Flow

1. Access token expires (401 response)
2. Client interceptor catches 401
3. Client POSTs to `/auth/refresh` (refresh cookie sent automatically)
4. Server validates refresh token, invalidates old one, issues new pair
5. Client retries failed request with new access token
6. If refresh fails → clear auth state, redirect to login

### Token Rotation

- Each refresh invalidates the old refresh token and issues a new one
- If a reused (already-invalidated) refresh token is detected → revoke ALL tokens for that user (potential compromise)
- Store refresh token metadata (userAgent, ipAddress) for audit

### Password Policy

- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one number
- Hashed with bcryptjs (cost factor 12)

---

## CORS Configuration

```ts
// apps/server/src/config/cors.ts
const corsOptions = {
  origin: [
    "http://localhost:5173", // Vite dev server
    "https://your-app.com", // Production client
  ],
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
```

**Never use `origin: '*'` with `credentials: true`.**

---

## Rate Limiting

**Package:** `express-rate-limit`

| Scope         | Limit        | Window     | Purpose                |
| ------------- | ------------ | ---------- | ---------------------- |
| Global        | 100 requests | 15 minutes | General API protection |
| Auth routes   | 10 requests  | 15 minutes | Prevent brute force    |
| Idea creation | 20 requests  | 15 minutes | Prevent spam           |

```ts
// Global
const globalLimit = rateLimit({ max: 100, windowMs: 15 * 60 * 1000 });

// Auth (stricter)
const authLimit = rateLimit({ max: 10, windowMs: 15 * 60 * 1000 });
```

---

## Security Headers (Helmet)

**Package:** `helmet`

Sets:

- `Content-Security-Policy` — restrict resource loading
- `Strict-Transport-Security` — force HTTPS
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (modern browsers handle this natively)
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## Input Validation

**Package:** `zod`

- Every API endpoint validates input with Zod before processing
- Invalid input returns `422 UNPROCESSABLE` with field-level error details
- Server never trusts client input
- Validation middleware pattern:

```ts
const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: result.error.issues,
      },
    });
  }
  req.body = result.data;
  next();
};
```

---

## Row-Level Security (Data Isolation)

Every database query is scoped to the authenticated user:

```ts
// All queries include userId filter
const ideas = await prisma.idea.findMany({
  where: { userId: req.userId },
});
```

For shared resources (ideas shared with you):

```ts
const ideas = await prisma.idea.findMany({
  where: {
    OR: [
      { userId: req.userId }, // Own ideas
      { shares: { some: { userId: req.userId } } }, // Shared with user
    ],
  },
});
```

**Ownership checks** on mutations:

- Only owner can delete an idea
- Only owner can change share roles
- Only owner or EDIT users can update an idea
- Comment owner or idea owner can delete a comment

---

## File Path Traversal Prevention

Planning section files are read/written from `storage/content/{userId}/{ideaId}/`.

**Protection:**

- Validate that resolved path starts with the expected base directory
- Never use user input directly in file paths without sanitization
- Reject paths containing `..`, `/`, `\`, or null bytes

```ts
function safePath(baseDir: string, ...segments: string[]): string {
  const resolved = path.resolve(baseDir, ...segments);
  if (!resolved.startsWith(baseDir)) {
    throw new ForbiddenError("Invalid file path");
  }
  return resolved;
}
```

---

## CSRF Protection

- Refresh token cookie uses `SameSite=Strict` (prevents cross-site requests)
- State-changing requests require `Authorization` header (not cookie-based)
- Validate `Origin` / `Referer` headers on auth endpoints

---

## Environment Variables

- Never commit `.env` files
- Server validates all required env vars on startup (via Zod)
- Secrets: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
- Public: `VITE_API_URL` (exposed to client bundle)

See `environment.md` for full variable list.
