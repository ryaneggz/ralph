# Post Bridge API Endpoint Reference

Base URL: `https://api.post-bridge.com`

Authentication: `Authorization: Bearer $POST_BRIDGE_API_KEY`

---

## Table of Contents

1. [Social Accounts](#social-accounts)
2. [Media Management](#media-management)
3. [Posts](#posts)
4. [Analytics & Results](#analytics--results)
5. [Error Codes](#error-codes)
6. [Media Constraints](#media-constraints)

---

## Social Accounts

### List Social Accounts

```
GET /v1/social-accounts
```

Query parameters:
- `platform` - Filter by platform (e.g. `instagram`, `twitter`, `tiktok`)
- `username` - Filter by username (partial match)

Example:
```bash
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/social-accounts?platform=instagram"
```

### Get Social Account

```
GET /v1/social-accounts/{id}
```

Example:
```bash
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/social-accounts/acct_abc123"
```

---

## Media Management

### Create Upload URL

```
POST /v1/media/create-upload-url
```

Request body:
```json
{
  "filename": "video.mp4",
  "mime_type": "video/mp4"
}
```

Response includes:
- `upload_url` - Signed URL to PUT the file to
- `media_id` - ID to reference in post creation

Example:
```bash
curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "photo.jpg", "mime_type": "image/jpeg"}' \
  "https://api.post-bridge.com/v1/media/create-upload-url"
```

Upload file to the signed URL (no auth header needed):
```bash
curl -s -X PUT \
  -H "Content-Type: image/jpeg" \
  --data-binary @photo.jpg \
  "$UPLOAD_URL"
```

### List Media

```
GET /v1/media
```

Query parameters:
- `post_id` - Filter by associated post
- `type` - Filter by MIME type

Example:
```bash
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/media?type=video/mp4"
```

### Get Media

```
GET /v1/media/{id}
```

### Delete Media

```
DELETE /v1/media/{id}
```

Example:
```bash
curl -s -X DELETE \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/media/media_xyz789"
```

---

## Posts

### Create Post

```
POST /v1/posts
```

Request body:
```json
{
  "social_account_ids": ["acct_abc123"],
  "caption": "Your post caption here",
  "media_ids": ["media_xyz789"],
  "scheduled_at": "2026-03-10T14:00:00Z",
  "use_queue": false,
  "platform_config": {}
}
```

Fields:
- `social_account_ids` (required) - Array of target account IDs
- `caption` (required) - Post caption/text
- `media_ids` (optional) - Array of uploaded media IDs
- `scheduled_at` (optional) - ISO 8601 datetime; omit for immediate posting
- `use_queue` (optional) - Auto-schedule to next available slot
- `platform_config` (optional) - Platform-specific overrides (see below)

Instagram Reels cover image via `platform_config`:
```json
{
  "platform_config": {
    "instagram": {
      "reel_cover_media_id": "media_cover456"
    }
  }
}
```

Queue with timezone:
```json
{
  "use_queue": true,
  "timezone": "America/New_York"
}
```

Example:
```bash
curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "social_account_ids": ["acct_abc123"],
    "caption": "Check out our latest update!",
    "media_ids": ["media_xyz789"],
    "scheduled_at": "2026-03-10T14:00:00Z"
  }' \
  "https://api.post-bridge.com/v1/posts"
```

### List Posts

```
GET /v1/posts
```

Query parameters:
- `platform` - Filter by platform
- `status` - Filter by status (e.g. `draft`, `scheduled`, `published`, `failed`)

### Get Post

```
GET /v1/posts/{id}
```

### Update Post

```
PATCH /v1/posts/{id}
```

Request body: Any subset of post creation fields.

Example (reschedule):
```bash
curl -s -X PATCH \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scheduled_at": "2026-03-11T10:00:00Z"}' \
  "https://api.post-bridge.com/v1/posts/post_def456"
```

### Delete Post

```
DELETE /v1/posts/{id}
```

---

## Analytics & Results

### Get Analytics

```
GET /v1/analytics
```

### Sync Analytics

```
POST /v1/analytics/sync
```

Triggers a fresh pull of analytics data from connected platforms.

### Get Post Results

```
GET /v1/post-results
```

Returns publication outcomes (reach, impressions, engagement) per post.

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400  | Invalid request - check body/params |
| 404  | Resource not found |
| 429  | Rate limit exceeded - back off and retry |
| 500  | Server error - retry after delay |

---

## Media Constraints

| Property | Value |
|----------|-------|
| Supported types | `image/png`, `image/jpeg`, `video/mp4`, `video/quicktime` |
| Upload expiry | Short window after URL generation - upload promptly |
| Auto-deletion | 24 hours after upload if not attached to a post |
