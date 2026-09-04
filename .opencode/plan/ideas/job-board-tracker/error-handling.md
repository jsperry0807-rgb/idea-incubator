# Idea Incubator — Error Handling

## Server-Side Errors

### Custom Error Classes

```ts
// apps/server/src/lib/errors.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, "NOT_FOUND", `${resource} not found`);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown[]) {
    super(422, "VALIDATION_ERROR", "Invalid input", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}
```

### Centralized Error Middleware

```ts
// apps/server/src/middleware/errorHandler.ts

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Unknown errors (log for debugging, return generic message)
  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
    },
  });
}
```

### Error Response Format

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Idea not found",
    "details": [{ "field": "email", "message": "Invalid email address" }]
  }
}
```

### Status Code Mapping

| Code | Meaning           | When to Use                                  |
| ---- | ----------------- | -------------------------------------------- |
| 400  | Bad Request       | Malformed JSON, missing required fields      |
| 401  | Unauthorized      | No token, invalid/expired token              |
| 403  | Forbidden         | Valid token but no permission                |
| 404  | Not Found         | Resource doesn't exist or user has no access |
| 409  | Conflict          | Duplicate email, already shared              |
| 422  | Unprocessable     | Zod validation failed                        |
| 429  | Too Many Requests | Rate limit exceeded                          |
| 500  | Internal Error    | Unexpected server error                      |

---

## Client-Side Errors

### Axios Interceptor (401 Handling)

```ts
// apps/client/src/axios.ts

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 + not already retried + has refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { data } = await axiosInstance.post("/auth/refresh");
        const newToken = data.data.accessToken;
        setAccessToken(newToken); // Update in-memory token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest); // Retry original request
      } catch (refreshError) {
        // Refresh failed -> force logout
        clearAuth();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

### Toast Notifications (User-Facing Errors)

```ts
// After any mutation error:
onError: (error) => {
  if (error.response?.status === 422) {
    // Validation errors shown inline in forms
    return;
  }
  toast.error(error.response?.data?.error?.message || "Something went wrong");
};
```

### Inline Form Errors

React Hook Form + Zod shows field-level errors:

```tsx
<Input
  label="Email"
  error={errors.email?.message} // "Invalid email address"
  {...register("email")}
/>
```

### Error Boundaries (React Crashes)

```tsx
// apps/client/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          icon={<AlertTriangle />}
          title="Something went wrong"
          description="An unexpected error occurred. Please try refreshing the page."
          action={{ label: "Refresh", onClick: () => window.location.reload() }}
        />
      );
    }
    return this.props.children;
  }
}
```

Wrap route-level components:

```tsx
<Route
  element={
    <ErrorBoundary>
      <IdeaDetailPage />
    </ErrorBoundary>
  }
/>
```

---

## Error Handling Checklist

- [ ] Every API endpoint has try/catch or uses async error handling
- [ ] Unknown errors return generic 500 (never leak stack traces in production)
- [ ] All errors logged server-side with request context
- [ ] Client shows user-friendly toast for non-validation errors
- [ ] Client shows inline errors for form validation
- [ ] 401 triggers automatic refresh attempt
- [ ] Failed refresh redirects to login
- [ ] Error boundaries catch React rendering crashes
- [ ] Loading states shown during async operations
- [ ] Empty states shown when data is absent
