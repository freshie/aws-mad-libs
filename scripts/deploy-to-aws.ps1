# AI Mad Libs - Complete AWS Deployment Script
# This script deploys the entire application to AWS

param(
    [string]$Profile = "default",
    [switch]$SkipBuild = $false,
    [switch]$SkipTests = $false
)

Write-Host "🚀 Starting AWS Deployment for AI Mad Libs" -ForegroundColor Green
Write-Host "Using AWS Profile: $Profile" -ForegroundColor Yellow

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Blue

# Check AWS CLI
try {
    aws --version | Out-String
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    exit 1
}

# Check CDK
try {
    cdk --version | Out-String
    Write-Host "✅ AWS CDK found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CDK not found. Installing..." -ForegroundColor Yellow
    npm install -g aws-cdk
}

# Check Node.js
try {
    node --version | Out-String
    Write-Host "✅ Node.js found" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Step 1: Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Host "🧪 Running tests..." -ForegroundColor Blue
    
    # Frontend tests
    Write-Host "Testing frontend..." -ForegroundColor Yellow
    npm test -- --watchAll=false --coverage=false
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend tests failed" -ForegroundColor Red
        exit 1
    }
    
    # Lambda tests
    Write-Host "Testing Lambda functions..." -ForegroundColor Yellow
    cd lambda
    npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Lambda tests failed" -ForegroundColor Red
        exit 1
    }
    cd ..
    
    Write-Host "✅ All tests passed" -ForegroundColor Green
}

# Step 2: Build Lambda functions (unless skipped)
if (-not $SkipBuild) {
    Write-Host "🔨 Building Lambda functions..." -ForegroundColor Blue
    cd lambda
    npm install
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Lambda build failed" -ForegroundColor Red
        exit 1
    }
    cd ..
    Write-Host "✅ Lambda functions built successfully" -ForegroundColor Green
}

# Step 3: Deploy CDK stack
Write-Host "☁️ Deploying CDK stack..." -ForegroundColor Blue
cd cdk
npm install
cdk deploy --require-approval never --profile $Profile
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ CDK deployment failed" -ForegroundColor Red
    exit 1
}
cd ..
Write-Host "✅ CDK stack deployed successfully" -ForegroundColor Green

# Step 4: Get deployment info
Write-Host "📊 Getting deployment information..." -ForegroundColor Blue
$stackOutputs = aws cloudformation describe-stacks --stack-name MadLibsServerlessStack --profile $Profile --query "Stacks[0].Outputs" --output json | ConvertFrom-Json

$bucketName = ($stackOutputs | Where-Object { $_.OutputKey -eq "S3BucketName" }).OutputValue
$distributionId = ($stackOutputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue
$cloudfrontUrl = ($stackOutputs | Where-Object { $_.OutputKey -eq "CloudFrontURL" }).OutputValue

Write-Host "S3 Bucket: $bucketName" -ForegroundColor Yellow
Write-Host "CloudFront Distribution ID: $distributionId" -ForegroundColor Yellow
Write-Host "CloudFront URL: $cloudfrontUrl" -ForegroundColor Yellow

# Step 5: Build and deploy frontend (unless skipped)
if (-not $SkipBuild) {
    Write-Host "🌐 Building and deploying frontend..." -ForegroundColor Blue
    npm install
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Frontend build failed" -ForegroundColor Red
        exit 1
    }
    
    # Sync to S3
    Write-Host "📤 Syncing files to S3..." -ForegroundColor Yellow
    aws s3 sync out/ s3://$bucketName --delete --profile $Profile --output text | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ S3 sync failed" -ForegroundColor Red
        exit 1
    }
    
    # Create CloudFront invalidation
    Write-Host "🔄 Creating CloudFront invalidation..." -ForegroundColor Yellow
    $invalidationId = aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --profile $Profile --output text --query 'Invalidation.Id'
    Write-Host "✅ CloudFront invalidation created: $invalidationId" -ForegroundColor Green
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ CloudFront invalidation failed, but deployment may still work" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Frontend deployed successfully" -ForegroundColor Green
}

# Step 6: Verify deployment
Write-Host "🔍 Verifying deployment..." -ForegroundColor Blue

# Check if CloudFront URL is accessible
try {
    $response = Invoke-WebRequest -Uri $cloudfrontUrl -Method Head -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ CloudFront URL is accessible" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ CloudFront URL not yet accessible (may take a few minutes)" -ForegroundColor Yellow
}

# Final success message
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application is available at: $cloudfrontUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Blue
Write-Host "1. Wait 2-3 minutes for CloudFront distribution to fully deploy" -ForegroundColor White
Write-Host "2. Test the application at the URL above" -ForegroundColor White
Write-Host "3. Check CloudWatch logs if you encounter any issues" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Blue
Write-Host "- View logs: aws logs tail /aws/lambda/mad-libs-story-generation --follow" -ForegroundColor White
Write-Host "- Check S3: aws s3 ls s3://$bucketName" -ForegroundColor White
Write-Host "- CDK status: cd cdk && cdk list" -ForegroundColor White