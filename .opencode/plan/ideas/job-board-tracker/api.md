# Idea Incubator — API Contract

Base URL: `http://localhost:3000` (dev) or production URL.

All responses follow the `ApiEnvelope<T>` pattern:
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

Errors follow:
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Idea not found",
    "details": []
  }
}
```

---

## Authentication

### POST /auth/register

Create a new user account.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secureP@ss1"
}
```

**Response (201):**
```json
{
  "data": {
    "user": { "id": "cuid...", "name": "Jane Doe", "email": "jane@example.com" },
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

**Cookies:** `refresh_token` set (HttpOnly, Secure, SameSite=Strict, 30 days)

**Errors:**
- `409 CONFLICT` — Email already registered
- `422 UNPROCESSABLE` — Validation errors (missing/invalid fields)

---

### POST /auth/login

**Request:**
```json
{
  "email": "jane@example.com",
  "password": "secureP@ss1"
}
```

**Response (200):**
```json
{
  "data": {
    "user": { "id": "cuid...", "name": "Jane Doe", "email": "jane@example.com", "avatarUrl": null },
    "accessToken": "eyJ...",
    "expiresIn": 900
  }
}
```

**Cookies:** `refresh_token` set

**Errors:**
- `401 UNAUTHORIZED` — Invalid email or password

---

### POST /auth/refresh

Rotate refresh token and issue new access token.

**Request:** No body. Reads `refresh_token` from cookie.

**Response (200):**
```json
{
  "data": {
    "accessToken": "eyJ...(new)",
    "expiresIn": 900
  }
}
```

**Cookies:** New `refresh_token` set (old one invalidated)

**Errors:**
- `401 UNAUTHORIZED` — Invalid or expired refresh token

---

### GET /auth/me

Get current user profile. **Requires auth.**

**Response (200):**
```json
{
  "data": {
    "id": "cuid...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatarUrl": null,
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

## Ideas

### GET /ideas

List user's ideas with filtering, search, and pagination.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 50) |
| `status` | string | — | Filter by status (comma-separated: `IDEA,PLANNING`) |
| `priority` | string | — | Filter by priority |
| `tag` | string | — | Filter by tag name |
| `search` | string | — | Search in title + description |
| `sort` | string | `recent` | Sort: `recent`, `alpha`, `priority`, `status` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid...",
      "title": "Blog CMS Platform",
      "slug": "blog-cms-platform",
      "description": "A headless CMS for blogs",
      "status": "PLANNING",
      "priority": "HIGH",
      "tags": [
        { "id": "cuid...", "name": "React", "color": "#61DAFB" }
      ],
      "taskCount": 10,
      "completedTaskCount": 4,
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-20T14:00:00Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 24 }
}
```

---

### GET /ideas/:id

Get a single idea with full details. **Includes own ideas + shared ideas.**

**Response (200):**
```json
{
  "data": {
    "id": "cuid...",
    "title": "Blog CMS Platform",
    "slug": "blog-cms-platform",
    "description": "A headless CMS for blogs",
    "status": "PLANNING",
    "priority": "HIGH",
    "tags": [
      { "id": "cuid...", "name": "React", "color": "#61DAFB" }
    ],
    "tasks": [
      { "id": "cuid...", "title": "Set up project structure", "completed": true, "milestone": "Planning", "sortOrder": 0 },
      { "id": "cuid...", "title": "Design database schema", "completed": true, "milestone": "Planning", "sortOrder": 1 }
    ],
    "taskCount": 10,
    "completedTaskCount": 4,
    "user": { "id": "cuid...", "name": "Jane Doe", "avatarUrl": null },
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-20T14:00:00Z"
  }
}
```

**Errors:**
- `404 NOT_FOUND` — Idea doesn't exist or user has no access

---

### POST /ideas

Create a new idea. Automatically generates planning folder with default `.md` files.

**Request:**
```json
{
  "title": "URL Shortener",
  "description": "A simple URL shortening service",
  "status": "IDEA",
  "priority": "MEDIUM",
  "tagIds": ["cuid-tag1", "cuid-tag2"]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "cuid...",
    "title": "URL Shortener",
    "slug": "url-shortener",
    "status": "IDEA",
    "priority": "MEDIUM",
    "tags": [...],
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

**Side effects:**
- Creates planning folder `storage/content/{userId}/{ideaId}/` with 4 default `.md` files
- Creates DB records for selected tags (via IdeaTag)

---

### PATCH /ideas/:id

Update an idea. Only the owner or users with EDIT access can update.

**Request (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "PLANNING",
  "priority": "HIGH",
  "tagIds": ["cuid-tag1"]
}
```

**Response (200):** Updated idea object.

**Side effects:**
- If `title` changes, regenerates `slug`
- If `status` changes, no file changes (status is metadata only)

---

### DELETE /ideas/:id

Delete an idea and all associated data. **Owner only.**

**Response (204):** No body.

**Side effects:**
- Deletes planning folder and all `.md` files
- Cascades: tasks, comments, shares, tags removed

---

### GET /ideas/pipeline

Get ideas grouped by status for Kanban view.

**Response (200):**
```json
{
  "data": {
    "IDEA": [
      { "id": "cuid...", "title": "Habit Tracker", "priority": "LOW", "tags": [...], "taskCount": 3, "completedTaskCount": 0 }
    ],
    "PLANNING": [
      { "id": "cuid...", "title": "Blog CMS Platform", "priority": "HIGH", "tags": [...], "taskCount": 10, "completedTaskCount": 4 }
    ],
    "PLANNED": [],
    "IN_PROGRESS": [],
    "DONE": [],
    "ARCHIVED": []
  }
}
```

---

### PATCH /ideas/:id/status

Quick status change (used by Kanban drag-and-drop).

**Request:**
```json
{ "status": "IN_PROGRESS" }
```

**Response (200):** Updated idea object.

---

## Planning Sections

### GET /ideas/:id/planning/:section

Read a planning section file. Sections: `overview`, `tech-stack`, `features`, `timeline`, `risks`.

**Response (200):**
```json
{
  "data": {
    "section": "overview",
    "content": "# Blog CMS Platform\n\n## What It Is\n\n...",
    "exists": true
  }
}
```

**Errors:**
- `404 NOT_FOUND` — Section file doesn't exist (e.g., `risks.md` not yet created)

---

### PUT /ideas/:id/planning/:section

Write/update a planning section file. Creates the file if it doesn't exist.

**Request:**
```json
{
  "content": "# Blog CMS Platform\n\n## What It Is\n\nA modern headless CMS..."
}
```

**Response (200):**
```json
{
  "data": {
    "section": "overview",
    "updatedAt": "2026-01-20T14:00:00Z"
  }
}
```

---

## Tasks

### GET /ideas/:id/tasks

List tasks for an idea, ordered by milestone and sort order.

**Response (200):**
```json
{
  "data": [
    { "id": "cuid...", "title": "Set up project", "completed": true, "milestone": "Planning", "sortOrder": 0 },
    { "id": "cuid...", "title": "Design API", "completed": false, "milestone": "Planning", "sortOrder": 1 },
    { "id": "cuid...", "title": "Build UI", "completed": false, "milestone": "Development", "sortOrder": 2 }
  ]
}
```

---

### POST /ideas/:id/tasks

Create a task.

**Request:**
```json
{
  "title": "Write tests",
  "milestone": "Development",
  "sortOrder": 5
}
```

**Response (201):** Created task object.

---

### PATCH /ideas/:id/tasks/:taskId

Update a task (title, completed, milestone, sortOrder).

**Request:**
```json
{ "completed": true }
```

**Response (200):** Updated task object.

---

### DELETE /ideas/:id/tasks/:taskId

Delete a task. **Response (204).**

---

## Comments

### GET /ideas/:id/comments

List comments for an idea, newest first.

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid...",
      "content": "Great idea! Let's add auth too.",
      "user": { "id": "cuid...", "name": "Jane Doe", "avatarUrl": null },
      "createdAt": "2026-01-20T14:00:00Z",
      "updatedAt": "2026-01-20T14:00:00Z"
    }
  ]
}
```

---

### POST /ideas/:id/comments

Add a comment. Owner or users with EDIT/VIEW access.

**Request:**
```json
{ "content": "Looks good to me!" }
```

**Response (201):** Created comment object. Sends notification to idea owner (if commenter is not the owner).

---

### PATCH /ideas/:id/comments/:commentId

Update a comment. **Owner of the comment only.**

**Request:** `{ "content": "Updated text" }`

---

### DELETE /ideas/:id/comments/:commentId

Delete a comment. **Comment owner or idea owner.** Response (204).

---

## Shares

### GET /ideas/:id/shares

List users who have access to an idea. **Owner only.**

**Response (200):**
```json
{
  "data": [
    { "userId": "cuid...", "name": "Bob", "email": "bob@example.com", "avatarUrl": null, "role": "EDIT" }
  ]
}
```

---

### POST /ideas/:id/shares

Share an idea with a user by email. **Owner only.**

**Request:**
```json
{
  "email": "bob@example.com",
  "role": "EDIT"
}
```

**Response (201):** Created share object. Sends notification to the invited user.

**Errors:**
- `404 NOT_FOUND` — User with that email not found
- `409 CONFLICT` — User already has access

---

### PATCH /ideas/:id/shares/:shareId

Change a user's access role. **Owner only.**

**Request:** `{ "role": "VIEW" }`

---

### DELETE /ideas/:id/shares/:shareId

Remove a user's access. **Owner only.** Response (204).

---

### GET /ideas/shared

List ideas shared with the current user.

**Response (200):**
```json
{
  "data": [
    {
      "idea": { "id": "cuid...", "title": "Blog CMS", "status": "PLANNING" },
      "sharedBy": { "id": "cuid...", "name": "Jane Doe", "avatarUrl": null },
      "role": "EDIT"
    }
  ]
}
```

---

## Notifications

### GET /notifications

List user's notifications, newest first.

**Query:** `?unread=true` to filter unread only.

**Response (200):**
```json
{
  "data": [
    {
      "id": "cuid...",
      "type": "SHARE",
      "message": "Jane shared \"Blog CMS Platform\" with you",
      "ideaId": "cuid...",
      "read": false,
      "createdAt": "2026-01-20T14:00:00Z"
    }
  ],
  "meta": { "unreadCount": 3 }
}
```

---

### PATCH /notifications/:id/read

Mark a notification as read. Response (200).

---

### POST /notifications/read-all

Mark all notifications as read. Response (200).

---

## Tags

### GET /tags

List user's tags.

**Response (200):**
```json
{
  "data": [
    { "id": "cuid...", "name": "React", "color": "#61DAFB" },
    { "id": "cuid...", "name": "SaaS", "color": "#FF6B6B" }
  ]
}
```

---

### POST /tags

Create a tag.

**Request:** `{ "name": "DevTool", "color": "#4ECDC4" }`

**Response (201):** Created tag object.

---

### PATCH /tags/:id

Update a tag. **Response (200):** Updated tag object.

---

### DELETE /tags/:id

Delete a tag. Cascades: removes all IdeaTag associations. **Response (204).**

---

## Dashboard

### GET /dashboard/stats

Get aggregate statistics for the current user.

**Response (200):**
```json
{
  "data": {
    "totalIdeas": 24,
    "byStatus": {
      "IDEA": 4,
      "PLANNING": 6,
      "PLANNED": 8,
      "IN_PROGRESS": 3,
      "DONE": 2,
      "ARCHIVED": 1
    },
    "totalTasks": 45,
    "completedTasks": 22
  }
}
```

---

### GET /dashboard/activity

Get recent activity (last 10 actions).

**Response (200):**
```json
{
  "data": [
    {
      "type": "STATUS_CHANGE",
      "message": "Moved \"Blog CMS\" to In Progress",
      "ideaId": "cuid...",
      "ideaTitle": "Blog CMS Platform",
      "createdAt": "2026-01-20T14:00:00Z"
    }
  ]
}
```