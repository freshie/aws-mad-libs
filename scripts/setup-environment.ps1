# AI Mad Libs Environment Setup Script

param(
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

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Show-Usage {
    Write-Host "AI Mad Libs Environment Setup" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This script helps you set up your local development environment." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Blue
    Write-Host "  .\scripts\setup-environment.ps1"
    Write-Host ""
    Write-Host "What this script does:" -ForegroundColor Blue
    Write-Host "  1. Copies .env.local.example to .env.local"
    Write-Host "  2. Guides you through configuration"
    Write-Host "  3. Tests your AWS setup"
    Write-Host "  4. Verifies everything is working"
}

if ($Help) {
    Show-Usage
    exit 0
}

Write-Host "🎮 AI Mad Libs Environment Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Warning ".env.local already exists"
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Status "Keeping existing .env.local file"
    } else {
        Copy-Item ".env.local.example" ".env.local" -Force
        Write-Success "Copied .env.local.example to .env.local"
    }
} else {
    if (Test-Path ".env.local.example") {
        Copy-Item ".env.local.example" ".env.local"
        Write-Success "Created .env.local from template"
    } else {
        Write-Error ".env.local.example not found!"
        Write-Host "Make sure you're in the project root directory" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "📝 Configuration Steps" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

# Step 2: Guide user through configuration
Write-Host ""
Write-Host "1. AWS Credentials Setup" -ForegroundColor Yellow
Write-Host "   You need to configure AWS credentials in .env.local"
Write-Host "   📖 See: docs/ENVIRONMENT_SETUP.md for detailed instructions"
Write-Host ""

$configureNow = Read-Host "Do you want to configure AWS credentials now? (y/N)"
if ($configureNow -eq "y" -or $configureNow -eq "Y") {
    Write-Host ""
    Write-Host "AWS Configuration:" -ForegroundColor Blue
    
    $accessKey = Read-Host "Enter your AWS Access Key ID"
    $secretKey = Read-Host "Enter your AWS Secret Access Key" -AsSecureString
    $region = Read-Host "Enter your AWS Region (default: us-east-1)"
    $bucketName = Read-Host "Enter your S3 bucket name (e.g., ai-mad-libs-media-yourname-2025)"
    
    if (-not $region) { $region = "us-east-1" }
    
    # Convert secure string back to plain text for file writing
    $secretKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretKey))
    
    # Update .env.local file
    $envContent = Get-Content ".env.local"
    for ($i = 0; $i -lt $envContent.Length; $i++) {
        if ($envContent[$i] -match "^AWS_ACCESS_KEY_ID=") {
            $envContent[$i] = "AWS_ACCESS_KEY_ID=$accessKey"
        }
        elseif ($envContent[$i] -match "^AWS_SECRET_ACCESS_KEY=") {
            $envContent[$i] = "AWS_SECRET_ACCESS_KEY=$secretKeyPlain"
        }
        elseif ($envContent[$i] -match "^AWS_REGION=") {
            $envContent[$i] = "AWS_REGION=$region"
        }
        elseif ($envContent[$i] -match "^S3_BUCKET_NAME=") {
            $envContent[$i] = "S3_BUCKET_NAME=$bucketName"
        }
    }
    
    $envContent | Set-Content ".env.local"
    Write-Success "Updated .env.local with your AWS configuration"
} else {
    Write-Host "⚠️  Please manually edit .env.local with your AWS credentials" -ForegroundColor Yellow
    Write-Host "   See docs/ENVIRONMENT_SETUP.md for instructions" -ForegroundColor Gray
}

Write-Host ""
Write-Host "2. Install Dependencies" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Status "Dependencies already installed"
} else {
    Write-Status "Installing dependencies..."
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Dependencies installed successfully"
    } else {
        Write-Error "Failed to install dependencies"
        exit 1
    }
}

Write-Host ""
Write-Host "3. Test Configuration" -ForegroundColor Yellow
Write-Status "Testing AWS connectivity..."

try {
    # Test if we can load environment variables
    $env:NODE_ENV = "development"
    
    # Try to test AWS (this might fail if credentials aren't set up yet)
    Write-Status "Running configuration check..."
    npm run check:deployment
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Configuration test passed!"
    } else {
        Write-Warning "Configuration test had issues - check the output above"
    }
} catch {
    Write-Warning "Could not test configuration automatically"
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. 📖 Review docs/ENVIRONMENT_SETUP.md for detailed configuration"
Write-Host "2. 🔐 Enable Amazon Bedrock models in AWS Console"
Write-Host "3. 🧪 Test your setup: npm run dev"
Write-Host "4. 🚀 Set up deployment: npm run setup:deploy-user"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  npm run dev                 # Start development server"
Write-Host "  npm run check:deployment    # Verify configuration"
Write-Host "  npm run config:deployment   # Configure deployment profile"
Write-Host "  npm run verify:deploy-user  # Verify deployment setup"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  docs/ENVIRONMENT_SETUP.md   # Complete setup guide"
Write-Host "  docs/LOCAL_CONFIG.md        # Configuration reference"
Write-Host "  docs/SERVERLESS_DEPLOYMENT.md # Deployment guide"
Write-Host ""
Write-Host "Happy coding! 🎮✨" -ForegroundColor Green