# Setup Guide — Ralph Orchestrator

Complete these steps before starting the Ralph loop.

## 1. Clone and checkout

```bash
git clone https://github.com/ryaneggz/ralph-orchestra.git ralph-orchestrator
cd ralph-orchestrator
git checkout ryaneggz/1-greenfield-ralph
```

## 2. Install dependencies

```bash
cd ralph-orchestrator  # the nested Next.js app directory
npm install
```

## 3. Create environment file

```bash
mkdir -p ~/.env/ralph-orchestrator
cp ralph-orchestrator/.env.example ~/.env/ralph-orchestrator/.env.local
```

Edit `~/.env/ralph-orchestrator/.env.local` and fill in real values:

| Variable | How to get it |
|---|---|
| `MONGODB_URI` | MongoDB Atlas → Connect → Driver → copy connection string |
| `AUTH_SECRET` | Run `npx auth secret` and copy the output |
| `AUTH_URL` | `http://localhost:3000` for local dev |
| `GITHUB_CLIENT_ID` | GitHub → Settings → Developer Settings → OAuth Apps → New |
| `GITHUB_CLIENT_SECRET` | Same as above |
| `AWS_ACCESS_KEY_ID` | AWS IAM → Create access key (see `aws-iam-policy.json` for permissions) |
| `AWS_SECRET_ACCESS_KEY` | Same as above |
| `AWS_REGION` | Your preferred region, e.g. `us-east-1` |
| `PULUMI_ACCESS_TOKEN` | Pulumi Console → Settings → Access Tokens (needed for IaC stories) |

> **Minimum for US-01–US-03 (auth):** `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`
>
> **For GitHub login:** Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
>
> AWS and Pulumi vars can be added later when those stories come up.
>
> **Note on repo access tokens:** Per-project repo access tokens (for private repos) are configured in the UI (US-04a) and stored in AWS Secrets Manager — they are NOT env vars.

## 4. Verify symlink exists

The project reads env from a symlink. Confirm it points to your file:

```bash
ls -la ralph-orchestrator/.env.local
# Should show: .env.local -> ~/.env/ralph-orchestrator/.env.local
```

If missing, recreate it:

```bash
ln -sf ~/.env/ralph-orchestrator/.env.local ralph-orchestrator/.env.local
```

## 5. Verify build

```bash
cd ralph-orchestrator
npm run build
npm run lint
```

Both should pass with zero errors.

## 6. Verify prd.json branch

The `prd.json` has `"branchName": "ralph/scaffold-platform"`. Ralph will try to check out or create this branch. Either:

- **Option A:** Create it now from the current branch:
  ```bash
  git checkout -b ralph/scaffold-platform
  git push -u origin ralph/scaffold-platform
  ```
- **Option B:** Update `prd.json` `branchName` to match the current branch (`ryaneggz/1-greenfield-ralph`).

## 7. Start the Ralph loop

```bash
claude --prompt-file prompt.md
```

Ralph will read `CLAUDE.md`, pick the first failing story from `prd.json`, implement it, and commit.

---

## Checklist

- [ ] Repo cloned and on correct branch
- [ ] `npm install` completed in `ralph-orchestrator/`
- [ ] `~/.env/ralph-orchestrator/.env.local` created with at least `MONGODB_URI`, `AUTH_SECRET`, `AUTH_URL`
- [ ] Symlink verified at `ralph-orchestrator/.env.local`
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `prd.json` branch name matches your working branch
