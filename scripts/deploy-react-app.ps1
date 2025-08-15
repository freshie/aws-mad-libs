# Deploy Full React App to S3

param(
    [string]$Environment = "development",
    [string]$Profile = "mad-libs-deploy"
)

Write-Host "[INFO] Deploying full React Mad Libs app..." -ForegroundColor Blue

# Set production environment variables
$env:NODE_ENV = "production"
$env:NEXT_PUBLIC_API_URL = "https://ae38g4kioc.execute-api.us-east-1.amazonaws.com/prod"
$env:NEXT_PUBLIC_ENVIRONMENT = $Environment

# Clean previous builds
Write-Host "[INFO] Cleaning previous builds..." -ForegroundColor Blue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force out -ErrorAction SilentlyContinue

# Build the Next.js app for static export
Write-Host "[INFO] Building Next.js app..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed. Deploying simplified version instead..." -ForegroundColor Red
    
    # Deploy the working simplified version as fallback
    $bucketName = "madlibsserverless-$Environment-website-553368239051"
    aws s3 cp static-frontend/index.html s3://$bucketName/index.html --profile $Profile
    
    # Invalidate CloudFront cache
    $distributionId = "E1T68AAXY5CU2Q"
    aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --profile $Profile
    
    Write-Host "[INFO] Simplified version deployed as fallback" -ForegroundColor Yellow
    Write-Host "[INFO] Website URL: https://d1slt0acx6hx96.cloudfront.net/" -ForegroundColor Blue
    exit 0
}

# Check if export was successful
if (Test-Path "out") {
    Write-Host "[SUCCESS] Static export successful!" -ForegroundColor Green
    
    # Deploy to S3
    $bucketName = "madlibsserverless-$Environment-website-553368239051"
    Write-Host "[INFO] Uploading to S3 bucket: $bucketName" -ForegroundColor Blue
    
    aws s3 sync out s3://$bucketName --profile $Profile --delete
    
    # Invalidate CloudFront cache
    $distributionId = "E1T68AAXY5CU2Q"
    Write-Host "[INFO] Invalidating CloudFront cache..." -ForegroundColor Blue
    aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --profile $Profile
    
    Write-Host "[SUCCESS] Full React app deployed successfully!" -ForegroundColor Green
    Write-Host "[INFO] Website URL: https://d1slt0acx6hx96.cloudfront.net/" -ForegroundColor Blue
} else {
    Write-Host "[ERROR] Static export failed. Keeping current deployment." -ForegroundColor Red
    exit 1
}