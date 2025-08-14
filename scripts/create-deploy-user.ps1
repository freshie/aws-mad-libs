# PowerShell script to create CDK deployment user with appropriate permissions

$UserName = "mad-libs-cdk-deploy"
$PolicyName = "MadLibsCDKDeployPolicy"
$GroupName = "mad-libs-deployers"

Write-Host "🔐 Creating CDK deployment user and permissions..." -ForegroundColor Green

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

# Get current AWS account
$Account = aws sts get-caller-identity --query Account --output text
Write-Host "📋 Working with AWS Account: $Account" -ForegroundColor Cyan

# Create IAM policy
Write-Host "📝 Creating IAM policy..." -ForegroundColor Yellow
try {
    $PolicyArn = aws iam create-policy `
        --policy-name $PolicyName `
        --policy-document file://iam-policies/cdk-deploy-user-policy-restricted.json `
        --description "Policy for Mad Libs CDK deployment user" `
        --query 'Policy.Arn' `
        --output text 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        # Policy might already exist, try to get it
        $PolicyArn = aws iam get-policy `
            --policy-arn "arn:aws:iam::$Account:policy/$PolicyName" `
            --query 'Policy.Arn' `
            --output text
    }
} catch {
    Write-Host "Error creating policy" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Policy created/found: $PolicyArn" -ForegroundColor Green

# Create IAM group
Write-Host "👥 Creating IAM group..." -ForegroundColor Yellow
try {
    aws iam create-group --group-name $GroupName 2>$null
} catch {
    Write-Host "Group already exists" -ForegroundColor Yellow
}

# Attach policy to group
Write-Host "🔗 Attaching policy to group..." -ForegroundColor Yellow
aws iam attach-group-policy `
    --group-name $GroupName `
    --policy-arn $PolicyArn

# Create IAM user
Write-Host "👤 Creating IAM user..." -ForegroundColor Yellow
try {
    aws iam create-user --user-name $UserName 2>$null
} catch {
    Write-Host "User already exists" -ForegroundColor Yellow
}

# Add user to group
Write-Host "➕ Adding user to group..." -ForegroundColor Yellow
aws iam add-user-to-group `
    --group-name $GroupName `
    --user-name $UserName

# Create access keys
Write-Host "🔑 Creating access keys..." -ForegroundColor Yellow
try {
    $AccessKeyOutput = aws iam create-access-key --user-name $UserName 2>$null | ConvertFrom-Json
    
    if ($AccessKeyOutput) {
        $AccessKeyId = $AccessKeyOutput.AccessKey.AccessKeyId
        $SecretAccessKey = $AccessKeyOutput.AccessKey.SecretAccessKey
        
        Write-Host ""
        Write-Host "🎉 Deployment user created successfully!" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host "User Name: $UserName" -ForegroundColor White
        Write-Host "Access Key ID: $AccessKeyId" -ForegroundColor White
        Write-Host "Secret Access Key: $SecretAccessKey" -ForegroundColor White
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANT: Save these credentials securely!" -ForegroundColor Red
        Write-Host "💡 Configure them with: aws configure --profile mad-libs-deploy" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "To use this profile for CDK deployment:" -ForegroundColor Yellow
        Write-Host "`$env:AWS_PROFILE = 'mad-libs-deploy'" -ForegroundColor White
        Write-Host "npm run cdk:deploy" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  User already exists. Access keys not created." -ForegroundColor Yellow
    Write-Host "If you need new access keys, delete existing ones first:" -ForegroundColor Yellow
    Write-Host "aws iam list-access-keys --user-name $UserName" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Setup complete! User has permissions for:" -ForegroundColor Green
Write-Host "  - CDK bootstrap and deployment" -ForegroundColor White
Write-Host "  - Lambda function management" -ForegroundColor White
Write-Host "  - DynamoDB table operations" -ForegroundColor White
Write-Host "  - S3 bucket management" -ForegroundColor White
Write-Host "  - API Gateway configuration" -ForegroundColor White
Write-Host "  - CloudFront distribution" -ForegroundColor White
Write-Host "  - IAM role management (scoped)" -ForegroundColor White
Write-Host "  - CloudWatch logs" -ForegroundColor White
Write-Host "  - Bedrock AI model access" -ForegroundColor White