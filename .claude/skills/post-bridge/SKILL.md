---
name: post-bridge
description: |
  Interact with the Post Bridge social media post management API. Use when the user wants to publish posts, upload media, manage social accounts, schedule content, or retrieve analytics via the Post Bridge platform. Triggers on: post to instagram, upload media to post bridge, schedule a social post, list social accounts, create a post, publish video, post bridge api.
---

# Post Bridge API

Manage social media posts across connected accounts using the Post Bridge API. Authentication uses the `POST_BRIDGE_API_KEY` environment variable.

---

## Authentication

All requests require a Bearer token header. Verify the key is set before making calls:

```bash
echo "Key set: ${POST_BRIDGE_API_KEY:+yes}"
```

Use this header on every request:

```
Authorization: Bearer $POST_BRIDGE_API_KEY
```

---

## Core Workflow

Publishing a post follows four steps. Execute them in order - each step depends on the previous.

### Step 1: Retrieve Social Accounts

Identify which account(s) to publish to. Capture the account `id` values for use in post creation.

```bash
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/social-accounts" | jq .
```

Filter by platform if needed:

```bash
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/social-accounts?platform=instagram" | jq .
```

### Step 2: Generate Upload URL (media posts only)

Skip this step for text-only posts.

Request a signed upload URL for each media file. Note the `upload_url` and `media_id` from the response.

```bash
UPLOAD_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "photo.jpg", "mime_type": "image/jpeg"}' \
  "https://api.post-bridge.com/v1/media/create-upload-url")

UPLOAD_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.upload_url')
MEDIA_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.media_id')
echo "Media ID: $MEDIA_ID"
```

### Step 3: Upload File to Signed URL

PUT the file directly to the signed URL. No authorization header is needed for this request.

```bash
curl -s -X PUT \
  -H "Content-Type: image/jpeg" \
  --data-binary @/path/to/photo.jpg \
  "$UPLOAD_URL"
```

Upload promptly - the signed URL expires after a short window. Unused media auto-deletes after 24 hours.

### Step 4: Create Post

Combine the account ID(s) and media ID(s) to create the post.

```bash
curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"social_account_ids\": [\"$ACCOUNT_ID\"],
    \"caption\": \"Your caption here\",
    \"media_ids\": [\"$MEDIA_ID\"]
  }" \
  "https://api.post-bridge.com/v1/posts" | jq .
```

---

## Scheduling Options

**Immediate posting**: Omit `scheduled_at` entirely.

**Specific time**:
```json
{ "scheduled_at": "2026-03-10T14:00:00Z" }
```

**Auto-queue** (next available slot):
```json
{ "use_queue": true, "timezone": "America/New_York" }
```

---

## Examples

### Example 1: Publish an Image to Instagram Now

User: "Post this photo to my Instagram with the caption 'New arrivals just dropped.'"

```bash
# Step 1 - find the instagram account
ACCOUNT=$(curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/social-accounts?platform=instagram" | jq -r '.data[0].id')

# Step 2 - get upload URL
UPLOAD_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "arrivals.jpg", "mime_type": "image/jpeg"}' \
  "https://api.post-bridge.com/v1/media/create-upload-url")
UPLOAD_URL=$(echo "$UPLOAD_RESP" | jq -r '.upload_url')
MEDIA_ID=$(echo "$UPLOAD_RESP" | jq -r '.media_id')

# Step 3 - upload file
curl -s -X PUT -H "Content-Type: image/jpeg" \
  --data-binary @arrivals.jpg "$UPLOAD_URL"

# Step 4 - create post (no scheduled_at = publish immediately)
curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"social_account_ids\": [\"$ACCOUNT\"],
    \"caption\": \"New arrivals just dropped.\",
    \"media_ids\": [\"$MEDIA_ID\"]
  }" \
  "https://api.post-bridge.com/v1/posts" | jq .
```

### Example 2: Schedule a Video Reel with Custom Cover

User: "Schedule this reel for Friday at 9am EST with a custom thumbnail."

```bash
# Step 1 - get account
ACCOUNT=$(curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/social-accounts?platform=instagram" | jq -r '.data[0].id')

# Step 2+3 - upload reel video
REEL_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "reel.mp4", "mime_type": "video/mp4"}' \
  "https://api.post-bridge.com/v1/media/create-upload-url")
REEL_URL=$(echo "$REEL_RESP" | jq -r '.upload_url')
REEL_ID=$(echo "$REEL_RESP" | jq -r '.media_id')
curl -s -X PUT -H "Content-Type: video/mp4" --data-binary @reel.mp4 "$REEL_URL"

# Step 2+3 - upload cover image
COVER_RESP=$(curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "cover.jpg", "mime_type": "image/jpeg"}' \
  "https://api.post-bridge.com/v1/media/create-upload-url")
COVER_URL=$(echo "$COVER_RESP" | jq -r '.upload_url')
COVER_ID=$(echo "$COVER_RESP" | jq -r '.media_id')
curl -s -X PUT -H "Content-Type: image/jpeg" --data-binary @cover.jpg "$COVER_URL"

# Step 4 - create scheduled post with cover image
curl -s -X POST \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"social_account_ids\": [\"$ACCOUNT\"],
    \"caption\": \"Check this out!\",
    \"media_ids\": [\"$REEL_ID\"],
    \"scheduled_at\": \"2026-03-06T14:00:00Z\",
    \"platform_config\": {
      \"instagram\": {
        \"reel_cover_media_id\": \"$COVER_ID\"
      }
    }
  }" \
  "https://api.post-bridge.com/v1/posts" | jq .
```

### Example 3: List and Update a Scheduled Post

User: "Show me my scheduled posts and push the next one back by a day."

```bash
# List scheduled posts
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/posts?status=scheduled" | jq .

# Update the scheduled time of a specific post
curl -s -X PATCH \
  -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scheduled_at": "2026-03-11T14:00:00Z"}' \
  "https://api.post-bridge.com/v1/posts/post_def456" | jq .
```

### Example 4: Check Analytics

User: "Pull the latest analytics for my posts."

```bash
# Sync first to get fresh data
curl -s -X POST -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/analytics/sync" | jq .

# Then retrieve
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/analytics" | jq .

# Post-level results
curl -s -H "Authorization: Bearer $POST_BRIDGE_API_KEY" \
  "https://api.post-bridge.com/v1/post-results" | jq .
```

---

## Guidelines

- Always verify `POST_BRIDGE_API_KEY` is set before making API calls.
- Complete media uploads promptly after generating the signed URL - it expires quickly.
- Reference the full endpoint list and request/response shapes in `references/api-endpoints.md`.
- Use `jq .` to pretty-print JSON responses; adapt field access (`.data[0].id`) to actual response shape.
- When the user does not specify a time, ask whether they want immediate posting, a specific time, or queue scheduling.
- For multi-platform posts, include all target account IDs in the `social_account_ids` array in a single post creation call.
- On 429 errors, wait before retrying. On 500 errors, retry once after a brief delay.
