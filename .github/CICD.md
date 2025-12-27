# CI/CD Pipeline Documentation

## Overview

Dr. Nexus uses GitHub Actions for comprehensive CI/CD automation with 5 workflow pipelines covering testing, deployment, security, and releases.

---

## 🔄 Workflows

### 1. **Python Backend CI** (`python-ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches (Python files only)
- Pull requests to `main` or `develop`

**Jobs:**

#### Test (Matrix: Python 3.11, 3.12)
- ✓ Checkout code
- ✓ Setup Python with pip cache
- ✓ Install dependencies
- ✓ Lint with Ruff (syntax errors, undefined names)
- ✓ Type check with mypy
- ✓ Run unit tests with pytest
- ✓ Run integration tests (skipped on CI if no data)
- ✓ Upload coverage to Codecov

#### Build & Validate
- ✓ Import all models, ingestors, KB modules
- ✓ Security scan with `safety`

#### Code Quality
- ✓ Check formatting with Black
- ✓ Check import sorting with isort
- ✓ Calculate cyclomatic complexity
- ✓ Calculate maintainability index

**Status:** Runs on Python file changes

---

### 2. **Next.js Frontend CI** (`nextjs-ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches (Next.js files only)
- Pull requests to `main` or `develop`

**Jobs:**

#### Lint & Type Check
- ✓ Run ESLint
- ✓ TypeScript type checking

#### Build
- ✓ Build Next.js application
- ✓ Upload build artifacts (.next/)

#### Analyze Bundle
- ✓ Bundle size analysis
- ✓ Report first load JS size
- ✓ Static asset analysis

#### Lighthouse Performance
- ✓ Run Lighthouse CI
- ✓ Performance scoring
- ✓ Accessibility checks

#### Security Scan
- ✓ npm audit for vulnerabilities
- ✓ Check outdated dependencies

**Status:** Runs on frontend file changes

---

### 3. **Deploy to Vercel** (`deploy.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Jobs:**

#### Deploy
- ✓ Pull Vercel environment config
- ✓ Build production artifacts
- ✓ Deploy to Vercel production
- ✓ Output deployment URL
- ✓ Comment on PR with preview URL

#### Verify
- ✓ Health check (HTTP 200)
- ✓ Test critical routes
- ✓ Verify dashboard loaded

**Environment:** Production
**URL:** https://dr-nexus.vercel.app

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel API token

---

### 4. **CodeQL Security Analysis** (`codeql.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main`
- Scheduled: Every Monday at 6:00 AM UTC

**Jobs:**

#### Analyze (Matrix: JavaScript, Python)
- ✓ Initialize CodeQL
- ✓ Autobuild
- ✓ Perform security analysis
- ✓ Upload security alerts

**Queries:**
- `security-extended` - Extended security rules
- `security-and-quality` - Security + code quality

**Status:** Weekly scans + on-demand

---

### 5. **Release & Changelog** (`release.yml`)

**Triggers:**
- Push tags matching `v*.*.*` (e.g., v1.0.0)
- Manual workflow dispatch with version input

**Jobs:**

#### Create Release
- ✓ Generate changelog since previous tag
- ✓ Extract version number
- ✓ Create GitHub Release with notes
- ✓ Link to deployment and repository

#### Build Artifacts
- ✓ Build Python package (wheel)
- ✓ Build Next.js production bundle
- ✓ Create distribution archive
- ✓ Upload release artifacts

**Artifacts:** 30-day retention

---

## 📊 Status Badges

Current badges in README:

```markdown
[![Python Backend CI](https://github.com/zach-wendland/dr-nexus/actions/workflows/python-ci.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/python-ci.yml)
[![Next.js Frontend CI](https://github.com/zach-wendland/dr-nexus/actions/workflows/nextjs-ci.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/nextjs-ci.yml)
[![Deploy to Vercel](https://github.com/zach-wendland/dr-nexus/actions/workflows/deploy.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/zach-wendland/dr-nexus/actions/workflows/codeql.yml/badge.svg)](https://github.com/zach-wendland/dr-nexus/actions/workflows/codeql.yml)
```

---

## 🔐 Required Secrets

Configure these in **GitHub Settings → Secrets → Actions:**

| Secret | Purpose | Where to Get |
|--------|---------|--------------|
| `VERCEL_TOKEN` | Deploy to Vercel | Vercel Dashboard → Settings → Tokens |
| `CODECOV_TOKEN` | Upload coverage reports | Codecov.io (optional) |
| `GITHUB_TOKEN` | Built-in, auto-provided | Automatic |

---

## 🚀 Workflow Usage

### Running Workflows Manually

**Deploy to Production:**
```bash
gh workflow run deploy.yml
```

**Create Release:**
```bash
# Via tag
git tag v1.0.1
git push origin v1.0.1

# Via workflow dispatch
gh workflow run release.yml -f version=1.0.1
```

### Viewing Workflow Runs

```bash
# List all workflow runs
gh run list

# View specific workflow
gh run view <run-id>

# Watch live
gh run watch
```

---

## 📈 Pipeline Flow

```
┌─────────────────────────────────────────────────────────────┐
│  PUSH TO MAIN                                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                  ┌──────────────────┐
│ Python Backend CI│                  │ Next.js CI       │
├──────────────────┤                  ├──────────────────┤
│ • Test (3.11)    │                  │ • Lint & Type    │
│ • Test (3.12)    │                  │ • Build          │
│ • Build          │                  │ • Bundle Analysis│
│ • Quality Check  │                  │ • Lighthouse     │
└──────────────────┘                  └──────────────────┘
        ↓                                       ↓
        └───────────────────┬───────────────────┘
                            ↓
                  ┌──────────────────┐
                  │ Deploy to Vercel │
                  ├──────────────────┤
                  │ • Build          │
                  │ • Deploy         │
                  │ • Verify         │
                  └──────────────────┘
                            ↓
                  ┌──────────────────┐
                  │ Production       │
                  │ dr-nexus.vercel  │
                  └──────────────────┘
```

---

## 🔍 Code Quality Metrics

### Python
- **Linting:** Ruff (PEP 8, imports, syntax)
- **Type Checking:** mypy
- **Formatting:** Black
- **Import Sorting:** isort
- **Complexity:** Radon (cyclomatic complexity)
- **Security:** Safety (dependency vulnerabilities)

### TypeScript/Next.js
- **Linting:** ESLint
- **Type Checking:** TypeScript compiler
- **Bundle Analysis:** @next/bundle-analyzer
- **Performance:** Lighthouse CI
- **Security:** npm audit

---

## 📝 Best Practices

### Pull Requests
1. All CI checks must pass before merge
2. Code review required
3. Branch protection rules enforced
4. Preview deployment automatically created

### Commits
1. Use conventional commit format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `test:` - Tests
   - `ci:` - CI/CD changes
   - `refactor:` - Code refactoring

2. Sign commits (optional but recommended)

### Releases
1. Use semantic versioning (MAJOR.MINOR.PATCH)
2. Tag format: `v1.0.0`
3. Automated changelog generation
4. GitHub Release with artifacts

---

## 🐛 Troubleshooting

### Failed Python Tests
```bash
# Run locally first
pytest tests/ -v
pytest tests/unit/ -v --cov=dr_nexus
```

### Failed Next.js Build
```bash
# Clean build
rm -rf .next node_modules
npm install
npm run build
```

### Deployment Failures
```bash
# Check Vercel CLI
vercel --version
vercel whoami

# Manual deploy
vercel --prod
```

### CodeQL Issues
- Review security alerts in GitHub Security tab
- Fix vulnerabilities before merging

---

## 📊 Monitoring

### Deployment Status
- **Vercel Dashboard:** Real-time deployment logs
- **GitHub Actions:** Workflow run history
- **Production URL:** https://dr-nexus.vercel.app

### Performance Metrics
- **Lighthouse:** Automated performance scoring
- **Bundle Size:** Tracked in CI logs
- **Build Time:** Monitored in GitHub Actions

---

## 🎯 Future Enhancements

- [ ] E2E testing with Playwright
- [ ] Visual regression testing
- [ ] Automated dependency updates (Dependabot)
- [ ] Slack/Discord notifications
- [ ] Performance budgets
- [ ] Docker containerization
- [ ] Staging environment
- [ ] A/B testing infrastructure

---

**Last Updated:** December 27, 2025
**Maintained By:** Dr. Nexus Development Team
