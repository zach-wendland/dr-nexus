# GitHub Secrets Setup Guide

## 🔐 Required Secrets for CI/CD

### 1. VERCEL_TOKEN (Required for Auto-Deploy)

**Purpose:** Enables GitHub Actions to deploy to Vercel automatically

**How to Get Your Token:**

#### Step 1: Generate Vercel Token
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name it: `GitHub Actions - Dr Nexus`
4. Scope: **Full Account** (recommended) or specific team
5. Expiration: **No Expiration** (for continuous deployment)
6. Click **"Create"**
7. **Copy the token immediately** (shown only once!)

#### Step 2: Add to GitHub Secrets

**Option A: Using GitHub CLI (Recommended)**
```bash
# Replace YOUR_TOKEN_HERE with the token you just copied
gh secret set VERCEL_TOKEN --body "YOUR_TOKEN_HERE"
```

**Option B: Via GitHub Web Interface**
1. Go to: https://github.com/zach-wendland/dr-nexus/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `VERCEL_TOKEN`
4. Value: Paste your Vercel token
5. Click **"Add secret"**

#### Step 3: Verify
```bash
# Check if secret was added
gh secret list
```

You should see:
```
VERCEL_TOKEN  Updated YYYY-MM-DD
```

---

### 2. CODECOV_TOKEN (Optional - For Coverage Reports)

**Purpose:** Upload test coverage reports to Codecov.io

**How to Get Your Token:**

1. Go to [Codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add repository: `zach-wendland/dr-nexus`
4. Copy the repository upload token
5. Add to GitHub secrets:

```bash
gh secret set CODECOV_TOKEN --body "YOUR_CODECOV_TOKEN"
```

**Note:** This is optional. The CI will run without it, but coverage reports won't be uploaded.

---

## ✅ Verification

### Check Secrets Status
```bash
# List all secrets
gh secret list

# Expected output:
# VERCEL_TOKEN    Updated 2025-12-27
# CODECOV_TOKEN   Updated 2025-12-27  (if added)
```

### Test Deployment Workflow

After adding `VERCEL_TOKEN`, the deployment workflow will run automatically on the next push to `main`:

```bash
# Make a small change to trigger deployment
git commit --allow-empty -m "Test: Trigger deployment with VERCEL_TOKEN"
git push

# Watch the deployment workflow
gh run watch
```

Expected output:
```
Deploy to Vercel: ✓ Deploy (30s)
Deploy to Vercel: ✓ Verify (5s)
```

---

## 🚀 Quick Setup Script

Run this after getting your Vercel token:

```bash
#!/bin/bash

# Add VERCEL_TOKEN (replace with your actual token)
echo "Enter your Vercel token:"
read -s VERCEL_TOKEN
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
echo "✓ VERCEL_TOKEN added"

# Optional: Add CODECOV_TOKEN
read -p "Add Codecov token? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Enter your Codecov token:"
    read -s CODECOV_TOKEN
    gh secret set CODECOV_TOKEN --body "$CODECOV_TOKEN"
    echo "✓ CODECOV_TOKEN added"
fi

# Verify
echo ""
echo "=== Configured Secrets ==="
gh secret list
```

---

## 🔍 Troubleshooting

### Issue: "Resource not accessible by integration"

**Cause:** Workflow doesn't have permission to access secrets

**Solution:** Check workflow permissions in `.github/workflows/deploy.yml`:
```yaml
permissions:
  contents: read
  deployments: write
```

### Issue: "Error: Vercel token is invalid"

**Causes:**
1. Token expired
2. Token copied incorrectly
3. Token doesn't have required scopes

**Solution:**
1. Generate a new token from Vercel
2. Ensure you copy the entire token
3. Use "Full Account" scope when creating

### Issue: Deployment succeeds but no URL

**Cause:** Vercel project not properly linked

**Solution:**
```bash
# Re-link Vercel project
vercel link --yes
vercel env pull
```

---

## 📊 What Happens After Setup

Once `VERCEL_TOKEN` is configured:

1. **On every push to `main`:**
   - GitHub Actions pulls Vercel environment config
   - Builds production artifacts
   - Deploys to Vercel
   - Runs health checks
   - Updates deployment status

2. **On pull requests:**
   - Creates preview deployment
   - Comments PR with preview URL
   - Runs all CI checks

3. **Deployment URLs:**
   - Production: https://dr-nexus.vercel.app
   - Preview: https://dr-nexus-{pr-number}-{hash}.vercel.app

---

## 🔐 Security Best Practices

1. **Never commit tokens to git**
   - Tokens are sensitive credentials
   - Always use GitHub Secrets

2. **Rotate tokens periodically**
   - Generate new token every 6-12 months
   - Update GitHub secret with new token

3. **Use scoped tokens**
   - Minimum required permissions
   - For GitHub Actions: Full Account or Team scope

4. **Monitor usage**
   - Check GitHub Actions logs
   - Review Vercel deployment history

---

## 📝 Additional Information

### Vercel Token Scopes

| Scope | Access | Recommended For |
|-------|--------|-----------------|
| Full Account | All projects | Personal accounts |
| Team | Team projects only | Team/organization |
| Project | Single project | Restricted environments |

### GitHub Secrets Features

- ✅ Encrypted at rest
- ✅ Only accessible by workflows
- ✅ Never exposed in logs
- ✅ Can be updated anytime
- ✅ Audit trail in GitHub

---

## 🎯 Next Steps After Setup

1. ✅ Verify secrets are added
2. ✅ Push code to trigger deployment
3. ✅ Watch workflow run successfully
4. ✅ Confirm site is live at production URL
5. ✅ Enable branch protection rules (optional)

---

**Setup Guide Version:** 1.0.0
**Last Updated:** December 27, 2025
**Project:** Dr. Nexus Medical Knowledge Base
