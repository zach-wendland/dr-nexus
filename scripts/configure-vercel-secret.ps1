# Dr. Nexus - Automated Vercel Secret Configuration
# PowerShell script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dr. Nexus - Vercel Token Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is available
try {
    $ghVersion = gh --version 2>&1
    Write-Host "✓ GitHub CLI installed" -ForegroundColor Green
} catch {
    Write-Host "✗ GitHub CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 1: Get your Vercel Token" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host ""
Write-Host "Opening Vercel tokens page in your browser..." -ForegroundColor Cyan
Start-Process "https://vercel.com/account/tokens"
Write-Host ""
Write-Host "On the Vercel page:" -ForegroundColor White
Write-Host "  1. Click 'Create Token'" -ForegroundColor Gray
Write-Host "  2. Name: 'GitHub Actions - Dr Nexus'" -ForegroundColor Gray
Write-Host "  3. Scope: Full Account" -ForegroundColor Gray
Write-Host "  4. Click Create" -ForegroundColor Gray
Write-Host "  5. COPY THE TOKEN (shown only once!)" -ForegroundColor Red
Write-Host ""

Read-Host "Press Enter when you have copied the token"

Write-Host ""
Write-Host "Step 2: Add token to GitHub" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host ""

# Prompt for token (hidden input)
Write-Host "Paste your Vercel token (input will be hidden):" -ForegroundColor Cyan
$VERCEL_TOKEN = Read-Host -AsSecureString

# Convert secure string to plain text for gh CLI
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($VERCEL_TOKEN)
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($PlainToken)) {
    Write-Host "✗ No token provided" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Adding VERCEL_TOKEN to GitHub secrets..." -ForegroundColor Cyan

try {
    # Add secret to GitHub
    $PlainToken | gh secret set VERCEL_TOKEN
    Write-Host "✓ VERCEL_TOKEN configured successfully!" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add secret: $_" -ForegroundColor Red
    exit 1
}

# Clear plain text token from memory
$PlainToken = $null
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

Write-Host ""
Write-Host "Step 3: Verify Configuration" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host ""

# List secrets
Write-Host "Configured secrets:" -ForegroundColor Cyan
gh secret list

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. The deployment workflow will run on next push" -ForegroundColor Gray
Write-Host "  2. Watch it: gh run watch" -ForegroundColor Gray
Write-Host "  3. Production URL: https://dr-nexus.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "Documentation: .github\SETUP_SECRETS.md" -ForegroundColor Cyan
Write-Host ""
