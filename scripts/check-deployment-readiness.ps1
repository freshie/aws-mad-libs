# Mad Libs Deployment Readiness Check

param(
    [string]$Environment = "development"
)

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

Write-Host "Mad Libs Deployment Readiness Check" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host ""

$allChecksPass = $true

# Check 1: Node.js version
Write-Status "Checking Node.js version..."
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($majorVersion -ge 18) {
        Write-Success "Node.js version: $nodeVersion (OK)"
    } else {
        Write-Error "Node.js version: $nodeVersion (FAIL) - Requires v18 or higher"
        $allChecksPass = $false
    }
} catch {
    Write-Error "Node.js not found (FAIL)"
    $allChecksPass = $false
}

# Check 2: AWS CLI
Write-Status "Checking AWS CLI..."
try {
    $awsVersion = aws --version
    Write-Success "AWS CLI installed: $($awsVersion.Split()[0]) (OK)"
} catch {
    Write-Error "AWS CLI not found (FAIL)"
    $allChecksPass = $false
}

# Check 3: AWS Credentials
Write-Status "Checking AWS credentials..."
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Success "AWS credentials configured for account: $($identity.Account) (OK)"
} catch {
    Write-Error "AWS credentials not configured (FAIL)"
    $allChecksPass = $false
}

# Check 4: CDK Installation
Write-Status "Checking AWS CDK..."
try {
    $cdkVersion = npx cdk --version
    Write-Success "AWS CDK version: $cdkVersion (OK)"
} catch {
    Write-Error "AWS CDK not available (FAIL)"
    $allChecksPass = $false
}

# Check 5: Project Dependencies
Write-Status "Checking project dependencies..."
if (Test-Path "node_modules") {
    Write-Success "Project dependencies installed (OK)"
} else {
    Write-Warning "Project dependencies not installed - run 'npm install' (WARNING)"
}

# Check 6: Lambda Dependencies
Write-Status "Checking Lambda dependencies..."
if (Test-Path "lambda/node_modules") {
    Write-Success "Lambda dependencies installed (OK)"
} else {
    Write-Warning "Lambda dependencies not installed - will be installed during build (WARNING)"
}

# Check 7: Lambda Build
Write-Status "Checking Lambda build..."
if (Test-Path "lambda/dist") {
    $files = Get-ChildItem "lambda/dist" -Filter "*.js"
    if ($files.Count -ge 4) {
        Write-Success "Lambda functions built: $($files.Count) files (OK)"
    } else {
        Write-Warning "Lambda functions not fully built - run 'npm run build:lambda' (WARNING)"
    }
} else {
    Write-Warning "Lambda functions not built - run 'npm run build:lambda' (WARNING)"
}

# Check 8: CDK Synthesis
Write-Status "Checking CDK synthesis..."
try {
    npx cdk synth --quiet | Out-Null
    Write-Success "CDK synthesis successful (OK)"
} catch {
    Write-Error "CDK synthesis failed (FAIL)"
    $allChecksPass = $false
}

# Check 9: CDK Bootstrap
Write-Status "Checking CDK bootstrap..."
try {
    aws cloudformation describe-stacks --stack-name CDKToolkit --region us-east-1 | Out-Null
    Write-Success "CDK bootstrap completed (OK)"
} catch {
    Write-Warning "CDK not bootstrapped - run 'npx cdk bootstrap' (WARNING)"
}

# Check 10: Required Files
Write-Status "Checking required files..."
$requiredFiles = @(
    "cdk/mad-libs-serverless-stack.ts",
    "cdk/app.ts",
    "cdk.json",
    "lambda/src/story-generation.ts",
    "lambda/src/story-fill.ts",
    "lambda/src/image-generation.ts",
    "lambda/src/test-aws.ts",
    "scripts/deploy.ps1"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Success "All required files present (OK)"
} else {
    Write-Error "Missing files: $($missingFiles -join ', ') (FAIL)"
    $allChecksPass = $false
}

# Summary
Write-Host ""
Write-Host "Deployment Readiness Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

if ($allChecksPass) {
    Write-Success "All critical checks passed! Ready to deploy."
    Write-Host ""
    Write-Host "To deploy, run:" -ForegroundColor Yellow
    Write-Host "  npm run deploy:dev" -ForegroundColor White
    Write-Host "  # or" -ForegroundColor Gray
    Write-Host "  .\scripts\deploy.ps1 -Environment $Environment" -ForegroundColor White
} else {
    Write-Error "Some critical checks failed. Please fix the issues above before deploying."
    exit 1
}

Write-Host ""
Write-Host "Estimated deployment time: 10-15 minutes" -ForegroundColor Cyan
Write-Host "Estimated monthly cost: $22-50 (for 1K games)" -ForegroundColor Cyan