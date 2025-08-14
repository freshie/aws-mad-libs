# Verify Deployment User Setup

param(
    [string]$ProfileName = ""
)

# Load deployment profile from .env.local if not specified
if (-not $ProfileName) {
    $ProfileName = "mad-libs-deploy"  # Default fallback
    
    if (Test-Path ".env.local") {
        $envContent = Get-Content ".env.local"
        foreach ($line in $envContent) {
            if ($line -match "^AWS_DEPLOYMENT_PROFILE=(.+)$") {
                $ProfileName = $matches[1]
                break
            }
        }
    }
}

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

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

Write-Host "Verifying Deployment User Setup" -ForegroundColor Cyan
Write-Host "Profile: $ProfileName" -ForegroundColor Cyan
Write-Host ""

$allChecksPass = $true

# Check 1: Profile exists
Write-Status "Checking if AWS profile exists..."
try {
    $profiles = aws configure list-profiles
    if ($profiles -contains $ProfileName) {
        Write-Success "AWS profile '$ProfileName' found"
    } else {
        Write-Error "AWS profile '$ProfileName' not found"
        Write-Host "Available profiles:" -ForegroundColor Yellow
        $profiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
        Write-Host ""
        Write-Host "To create the deployment user, run:" -ForegroundColor Yellow
        Write-Host "  npm run setup:deploy-user" -ForegroundColor White
        $allChecksPass = $false
    }
} catch {
    Write-Error "Failed to list AWS profiles"
    $allChecksPass = $false
}

# Check 2: Profile credentials work
if ($allChecksPass) {
    Write-Status "Testing profile credentials..."
    try {
        $identity = aws sts get-caller-identity --profile $ProfileName --output json | ConvertFrom-Json
        Write-Success "Profile credentials work"
        Write-Host "  Account: $($identity.Account)" -ForegroundColor Gray
        Write-Host "  User: $($identity.Arn)" -ForegroundColor Gray
        
        # Check if it's the deployment user
        if ($identity.Arn -like "*mad-libs-cdk-deploy*") {
            Write-Success "Using correct deployment user"
        } else {
            Write-Warning "Profile may not be using the deployment user"
            Write-Host "  Expected user: mad-libs-cdk-deploy" -ForegroundColor Yellow
            Write-Host "  Actual user: $($identity.Arn)" -ForegroundColor Yellow
        }
    } catch {
        Write-Error "Profile credentials failed"
        Write-Host "Run 'aws configure --profile $ProfileName' to fix credentials" -ForegroundColor Yellow
        $allChecksPass = $false
    }
}

# Check 3: CDK permissions
if ($allChecksPass) {
    Write-Status "Testing CDK permissions..."
    try {
        # Test CloudFormation permissions (required for CDK)
        aws cloudformation describe-stacks --profile $ProfileName --region us-east-1 | Out-Null
        Write-Success "CloudFormation permissions work"
    } catch {
        Write-Warning "CloudFormation permissions may be limited (this is normal for new accounts)"
    }
}

# Check 4: Bootstrap status
if ($allChecksPass) {
    Write-Status "Checking CDK bootstrap status..."
    try {
        aws cloudformation describe-stacks --stack-name CDKToolkit --profile $ProfileName --region us-east-1 | Out-Null
        Write-Success "CDK is bootstrapped"
    } catch {
        Write-Warning "CDK not bootstrapped yet"
        Write-Host "Run: npx cdk bootstrap --profile $ProfileName" -ForegroundColor Yellow
    }
}

# Summary
Write-Host ""
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

if ($allChecksPass) {
    Write-Success "Deployment user is properly configured!"
    Write-Host ""
    Write-Host "Ready to deploy with:" -ForegroundColor Green
    Write-Host "  npm run deploy:dev" -ForegroundColor White
    Write-Host "  npm run deploy:staging" -ForegroundColor White
    Write-Host "  npm run deploy:prod" -ForegroundColor White
} else {
    Write-Error "Deployment user setup needs attention"
    Write-Host ""
    Write-Host "To set up the deployment user:" -ForegroundColor Yellow
    Write-Host "  npm run setup:deploy-user" -ForegroundColor White
    Write-Host ""
    Write-Host "Or manually configure:" -ForegroundColor Yellow
    Write-Host "  aws configure --profile $ProfileName" -ForegroundColor White
}

Write-Host ""
Write-Host "For more help, see: DEPLOYMENT_USER_SETUP.md" -ForegroundColor Cyan