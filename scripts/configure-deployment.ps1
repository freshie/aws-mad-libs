# Configure Deployment Profile

param(
    [string]$ProfileName = "",
    [switch]$List = $false,
    [switch]$Help = $false
)

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Show-Usage {
    Write-Host "Configure Deployment Profile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Blue
    Write-Host "  .\scripts\configure-deployment.ps1 [OPTIONS]"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Blue
    Write-Host "  -ProfileName NAME    Set the deployment profile name"
    Write-Host "  -List               List available AWS profiles"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Blue
    Write-Host "  .\scripts\configure-deployment.ps1 -ProfileName mad-libs-deploy"
    Write-Host "  .\scripts\configure-deployment.ps1 -List"
}

if ($Help) {
    Show-Usage
    exit 0
}

if ($List) {
    Write-Status "Available AWS profiles:"
    try {
        $profiles = aws configure list-profiles
        if ($profiles) {
            $profiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        } else {
            Write-Host "  No profiles found" -ForegroundColor Gray
        }
    } catch {
        Write-Error "Could not list AWS profiles. Make sure AWS CLI is installed."
    }
    exit 0
}

# Get current configuration
$currentProfile = "mad-libs-deploy"  # Default
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    foreach ($line in $envContent) {
        if ($line -match "^AWS_DEPLOYMENT_PROFILE=(.+)$") {
            $currentProfile = $matches[1]
            break
        }
    }
}

Write-Host "Current deployment profile: $currentProfile" -ForegroundColor Cyan
Write-Host ""

# If no profile specified, prompt user
if (-not $ProfileName) {
    Write-Host "Available profiles:" -ForegroundColor Blue
    try {
        $profiles = aws configure list-profiles
        if ($profiles) {
            $profiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        } else {
            Write-Host "  No profiles found" -ForegroundColor Gray
            Write-Host ""
            Write-Host "To create a deployment user profile:" -ForegroundColor Yellow
            Write-Host "  npm run setup:deploy-user" -ForegroundColor White
            exit 1
        }
    } catch {
        Write-Error "Could not list AWS profiles"
        exit 1
    }
    
    Write-Host ""
    $ProfileName = Read-Host "Enter deployment profile name (or press Enter for '$currentProfile')"
    
    if (-not $ProfileName) {
        $ProfileName = $currentProfile
    }
}

# Verify the profile exists
Write-Status "Verifying profile '$ProfileName'..."
try {
    $profiles = aws configure list-profiles
    if ($profiles -notcontains $ProfileName) {
        Write-Error "Profile '$ProfileName' not found"
        Write-Host "Available profiles: $($profiles -join ', ')" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To create the profile:" -ForegroundColor Yellow
        Write-Host "  aws configure --profile $ProfileName" -ForegroundColor White
        Write-Host "Or to create a deployment user:" -ForegroundColor Yellow
        Write-Host "  npm run setup:deploy-user" -ForegroundColor White
        exit 1
    }
    
    # Test the profile
    $identity = aws sts get-caller-identity --profile $ProfileName --output json | ConvertFrom-Json
    Write-Success "Profile '$ProfileName' is valid"
    Write-Host "  Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "  User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Error "Profile '$ProfileName' has invalid credentials"
    Write-Host "Run: aws configure --profile $ProfileName" -ForegroundColor Yellow
    exit 1
}

# Update .env.local
Write-Status "Updating .env.local..."

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    $updated = $false
    
    for ($i = 0; $i -lt $envContent.Length; $i++) {
        if ($envContent[$i] -match "^AWS_DEPLOYMENT_PROFILE=") {
            $envContent[$i] = "AWS_DEPLOYMENT_PROFILE=$ProfileName"
            $updated = $true
            break
        }
    }
    
    if (-not $updated) {
        # Add the configuration
        $envContent += ""
        $envContent += "# Deployment Configuration"
        $envContent += "AWS_DEPLOYMENT_PROFILE=$ProfileName"
    }
    
    $envContent | Set-Content ".env.local"
} else {
    Write-Error ".env.local file not found"
    exit 1
}

Write-Success "Deployment profile configured: $ProfileName"
Write-Host ""
Write-Host "You can now deploy with:" -ForegroundColor Green
Write-Host "  npm run deploy:dev" -ForegroundColor White
Write-Host "  npm run deploy:staging" -ForegroundColor White
Write-Host "  npm run deploy:prod" -ForegroundColor White
Write-Host ""
Write-Host "To verify the setup:" -ForegroundColor Green
Write-Host "  npm run verify:deploy-user" -ForegroundColor White