# Quick Deploy Script - Minimal Output
# Deploys frontend changes with minimal console output

param(
    [string]$Profile = "default"
)

Write-Host "Quick Deploy Starting..." -ForegroundColor Green

# Build frontend
Write-Host "Building..." -ForegroundColor Blue
npm run build | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

# Get bucket name from CDK outputs
Write-Host "Getting deployment info..." -ForegroundColor Blue
$stackOutputs = aws cloudformation describe-stacks --stack-name MadLibsServerless-development --profile $Profile --query "Stacks[0].Outputs" --output json --no-cli-pager | ConvertFrom-Json

$bucketName = ($stackOutputs | Where-Object { $_.OutputKey -eq "WebsiteBucketName" }).OutputValue
$distributionId = ($stackOutputs | Where-Object { $_.OutputKey -eq "CloudFrontDistributionId" }).OutputValue

# Sync to S3 (quiet)
Write-Host "Syncing to S3..." -ForegroundColor Blue
aws s3 sync out/ s3://$bucketName --delete --profile $Profile --output text | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 sync failed" -ForegroundColor Red
    exit 1
}

# Create CloudFront invalidation (quiet)
Write-Host "Invalidating CloudFront..." -ForegroundColor Blue
$invalidationId = aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --profile $Profile --output text --query 'Invalidation.Id'

Write-Host "Deploy complete!" -ForegroundColor Green
Write-Host "CloudFront URL: https://d1657msoon2g7h.cloudfront.net" -ForegroundColor Cyan
Write-Host "Invalidation ID: $invalidationId" -ForegroundColor Yellow
Write-Host "Changes will be live in 2-3 minutes" -ForegroundColor White