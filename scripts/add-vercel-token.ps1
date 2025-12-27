# Quick script to add VERCEL_TOKEN to GitHub Secrets

Write-Host "Adding VERCEL_TOKEN to GitHub Secrets..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please paste your Vercel token (input will be hidden):" -ForegroundColor Yellow

# Read token securely
$SecureToken = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)
$PlainToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Add to GitHub secrets
$PlainToken | gh secret set VERCEL_TOKEN

# Clean up
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
$PlainToken = $null

Write-Host ""
Write-Host "✓ VERCEL_TOKEN added successfully!" -ForegroundColor Green
Write-Host ""

# Verify
Write-Host "Configured secrets:" -ForegroundColor Cyan
gh secret list
