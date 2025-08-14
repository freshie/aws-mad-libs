# CDK Deployment Script for Mad Libs Serverless App (PowerShell)

Write-Host "🚀 Starting CDK deployment for Mad Libs Serverless App..." -ForegroundColor Green

# Check if AWS CLI is configured
try {
    $null = aws sts get-caller-identity 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "AWS CLI not configured"
    }
} catch {
    Write-Host "❌ AWS CLI not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Get current AWS account and region
$Account = aws sts get-caller-identity --query Account --output text
$Region = if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "us-east-1" }

Write-Host "📋 Deploying to Account: $Account, Region: $Region" -ForegroundColor Cyan

# Bootstrap CDK if needed
Write-Host "🔧 Checking CDK bootstrap status..." -ForegroundColor Yellow
try {
    $null = aws cloudformation describe-stacks --stack-name CDKToolkit --region $Region 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "CDK not bootstrapped"
    }
    Write-Host "✅ CDK already bootstrapped" -ForegroundColor Green
} catch {
    Write-Host "🔧 Bootstrapping CDK..." -ForegroundColor Yellow
    cdk bootstrap "aws://$Account/$Region"
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Synthesize the stack
Write-Host "🔨 Synthesizing CDK stack..." -ForegroundColor Yellow
cdk synth

# Deploy the stack
Write-Host "🚀 Deploying stack..." -ForegroundColor Yellow
cdk deploy --require-approval never

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "📊 You can view your resources in the AWS Console" -ForegroundColor Cyan