# Mad Libs Serverless Deployment Script for Windows PowerShell

param(
    [string]$Environment = "development",
    [string]$Region = "us-east-1",
    [string]$Profile = "",
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false,
    [switch]$SkipFrontend = $false,
    [switch]$Help = $false
)

# Function to show usage
function Show-Usage {
    Write-Host "Usage: .\scripts\deploy.ps1 [OPTIONS]" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Blue
    Write-Host "  -Environment ENV     Set environment (development, staging, production)"
    Write-Host "  -Region REGION       Set AWS region (default: us-east-1)"
    Write-Host "  -Profile PROFILE     Set AWS profile"
    Write-Host "  -SkipBuild          Skip building Lambda functions and frontend"
    Write-Host "  -SkipTests          Skip running tests"
    Write-Host "  -SkipFrontend       Skip frontend deployment to S3"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Blue
    Write-Host "  .\scripts\deploy.ps1 -Environment production -Region us-west-2"
    Write-Host "  .\scripts\deploy.ps1 -Environment staging -Profile my-aws-profile"
}

# Show help if requested
if ($Help) {
    Show-Usage
    exit 0
}

# Function to print colored output
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

# Validate environment
if ($Environment -notin @("development", "staging", "production")) {
    Write-Error "Invalid environment: $Environment"
    Write-Error "Valid environments: development, staging, production"
    exit 1
}

Write-Status "Starting deployment for environment: $Environment"
Write-Status "AWS Region: $Region"

# Load deployment profile from .env.local
$deploymentProfile = "mad-libs-deploy"  # Default fallback

if (Test-Path ".env.local") {
    Write-Status "Loading deployment configuration from .env.local..."
    $envContent = Get-Content ".env.local"
    foreach ($line in $envContent) {
        if ($line -match "^AWS_DEPLOYMENT_PROFILE=(.+)$") {
            $deploymentProfile = $matches[1]
            Write-Status "Found deployment profile in config: $deploymentProfile"
            break
        }
    }
}

# Set AWS profile - prioritize command line, then config, then default
if ($Profile) {
    $env:AWS_PROFILE = $Profile
    Write-Status "Using AWS profile from command line: $Profile"
} else {
    $env:AWS_PROFILE = $deploymentProfile
    Write-Status "Using deployment profile from config: $deploymentProfile"
    
    # Verify the profile exists
    try {
        $profiles = aws configure list-profiles
        if ($profiles -notcontains $deploymentProfile) {
            Write-Warning "Deployment profile '$deploymentProfile' not found."
            Write-Warning "Available profiles: $($profiles -join ', ')"
            Write-Warning "Run: npm run setup:deploy-user"
            Write-Warning "Or update AWS_DEPLOYMENT_PROFILE in .env.local"
        }
    } catch {
        Write-Warning "Could not verify AWS profiles"
    }
}

# For deployment, unset AWS credentials to force profile usage
Write-Status "Clearing AWS credential environment variables to use profile"
$env:AWS_ACCESS_KEY_ID = $null
$env:AWS_SECRET_ACCESS_KEY = $null

# Set environment variables
$env:NODE_ENV = $Environment
$env:CDK_DEFAULT_REGION = $Region

# Check if AWS CLI is configured
try {
    aws sts get-caller-identity | Out-Null
    Write-Success "AWS credentials validated"
} catch {
    Write-Error "AWS CLI is not configured or credentials are invalid"
    Write-Error "Please run 'aws configure' or set up your AWS credentials"
    exit 1
}

# Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Status "Installing dependencies..."
    npm install
}

# Run tests unless skipped (tests have been removed from this project)
if (!$SkipTests -and (Get-Command "npm test" -ErrorAction SilentlyContinue)) {
    Write-Status "Running tests..."
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed"
        exit 1
    }
    Write-Success "Tests passed"
} else {
    Write-Status "Skipping tests (no test script found or tests disabled)"
}

# Build Lambda functions unless skipped
if (!$SkipBuild) {
    Write-Status "Building Lambda functions..."
    
    # Build Lambda functions using npm script
    npm run build:lambda
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Lambda function build failed"
        exit 1
    }
    
    Write-Success "Lambda functions built successfully"
    
    # Build frontend unless skipped
    if (!$SkipFrontend) {
        Write-Status "Building frontend..."
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Frontend build failed"
            exit 1
        }
        
        Write-Success "Frontend built successfully"
    } else {
        Write-Status "Skipping frontend build"
    }
}

# Bootstrap CDK if needed
Write-Status "Checking CDK bootstrap status..."
try {
    aws cloudformation describe-stacks --stack-name CDKToolkit --region $Region | Out-Null
    Write-Status "CDK already bootstrapped"
} catch {
    Write-Status "Bootstrapping CDK..."
    npx cdk bootstrap --region $Region
    if ($LASTEXITCODE -ne 0) {
        Write-Error "CDK bootstrap failed"
        exit 1
    }
    Write-Success "CDK bootstrapped"
}

# Deploy CDK stack
Write-Status "Deploying CDK stack..."
$StackName = "MadLibsServerless-$Environment"

# Show diff first
Write-Status "Showing deployment diff..."
npx cdk diff $StackName --context environment=$Environment

# Ask for confirmation in production
if ($Environment -eq "production") {
    Write-Host ""
    $confirm = Read-Host "Are you sure you want to deploy to PRODUCTION? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Warning "Deployment cancelled"
        exit 0
    }
}

# Deploy the stack
Write-Status "Deploying stack: $StackName"
npx cdk deploy $StackName --context environment=$Environment --require-approval never --outputs-file "cdk-outputs-$Environment.json"

if ($LASTEXITCODE -ne 0) {
    Write-Error "CDK deployment failed"
    exit 1
}

Write-Success "CDK stack deployed successfully"

# Deploy frontend to S3 and invalidate CloudFront
if (!$SkipBuild -and !$SkipFrontend) {
    Write-Status "Deploying frontend to S3..."
    
    # Read deployment outputs to get bucket name and CloudFront distribution
    if (Test-Path "cdk-outputs-$Environment.json") {
        $outputs = Get-Content "cdk-outputs-$Environment.json" | ConvertFrom-Json
        $stackOutputs = $outputs."MadLibsServerless-$Environment"
        
        if ($stackOutputs.WebsiteBucketName -and $stackOutputs.CloudFrontDistributionId) {
            $bucketName = $stackOutputs.WebsiteBucketName
            $distributionId = $stackOutputs.CloudFrontDistributionId
            
            Write-Status "Uploading frontend files to S3 bucket: $bucketName"
            
            # Upload the built frontend files
            aws s3 sync .next/static s3://$bucketName/_next/static --delete --cache-control "public,max-age=31536000,immutable"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to upload static files to S3"
                exit 1
            }
            
            # Upload other frontend files
            aws s3 sync out s3://$bucketName --delete --exclude "_next/static/*" --cache-control "public,max-age=3600"
            if ($LASTEXITCODE -ne 0) {
                Write-Error "Failed to upload frontend files to S3"
                exit 1
            }
            
            Write-Success "Frontend files uploaded to S3"
            
            # Invalidate CloudFront cache
            Write-Status "Invalidating CloudFront cache..."
            aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "CloudFront invalidation failed, but deployment continues"
            } else {
                Write-Success "CloudFront cache invalidated"
            }
        } else {
            Write-Warning "Could not find S3 bucket or CloudFront distribution in outputs"
        }
    } else {
        Write-Warning "Could not read deployment outputs for frontend deployment"
    }
}

# Show outputs
if (Test-Path "cdk-outputs-$Environment.json") {
    Write-Status "Deployment outputs:"
    Get-Content "cdk-outputs-$Environment.json" | ConvertFrom-Json | ConvertTo-Json -Depth 10
}

Write-Success "Deployment completed successfully!"
Write-Status "Environment: $Environment"
Write-Status "Region: $Region"
Write-Status "Stack Name: $StackName"