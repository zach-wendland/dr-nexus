#!/bin/bash

# Dr. Nexus - GitHub Secrets Setup Script
# This script helps configure required secrets for CI/CD

set -e

echo "=========================================="
echo "Dr. Nexus - GitHub Secrets Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✓ GitHub CLI is installed and authenticated${NC}"
echo ""

# Function to add secret
add_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_optional=$3

    echo "----------------------------------------"
    echo -e "${YELLOW}$secret_name${NC}"
    echo "$secret_description"
    echo ""

    if [ "$is_optional" = "true" ]; then
        read -p "Add this secret? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⊘ Skipped${NC}"
            return
        fi
    fi

    echo "Enter the $secret_name value:"
    read -s secret_value
    echo ""

    if [ -z "$secret_value" ]; then
        echo -e "${RED}✗ No value provided, skipping${NC}"
        return
    fi

    # Add secret to GitHub
    if gh secret set "$secret_name" --body "$secret_value" 2>&1; then
        echo -e "${GREEN}✓ $secret_name added successfully${NC}"
    else
        echo -e "${RED}✗ Failed to add $secret_name${NC}"
    fi
    echo ""
}

# Add VERCEL_TOKEN (required)
echo "=========================================="
echo "1. VERCEL_TOKEN (Required)"
echo "=========================================="
echo ""
echo "To get your Vercel token:"
echo "  1. Visit: https://vercel.com/account/tokens"
echo "  2. Click 'Create Token'"
echo "  3. Name: 'GitHub Actions - Dr Nexus'"
echo "  4. Scope: Full Account"
echo "  5. Copy the token"
echo ""
read -p "Press Enter when you have your token ready..."
echo ""

add_secret "VERCEL_TOKEN" "Vercel deployment token for GitHub Actions" "false"

# Add CODECOV_TOKEN (optional)
echo "=========================================="
echo "2. CODECOV_TOKEN (Optional)"
echo "=========================================="
echo ""
echo "To get your Codecov token:"
echo "  1. Visit: https://codecov.io"
echo "  2. Sign in with GitHub"
echo "  3. Add repository: zach-wendland/dr-nexus"
echo "  4. Copy the upload token"
echo ""

add_secret "CODECOV_TOKEN" "Codecov.io upload token for coverage reports" "true"

# Summary
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Configured secrets:"
gh secret list
echo ""

echo -e "${GREEN}✓ Secrets setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Push code to trigger CI/CD: git push"
echo "  2. Watch workflow run: gh run watch"
echo "  3. Check deployment: https://dr-nexus.vercel.app"
echo ""
echo "Documentation:"
echo "  - .github/SETUP_SECRETS.md"
echo "  - .github/CICD.md"
echo ""
