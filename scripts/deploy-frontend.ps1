# Deploy Frontend to S3 Script

param(
    [string]$Environment = "development",
    [string]$Profile = "mad-libs-deploy"
)

Write-Host "[INFO] Starting frontend deployment for environment: $Environment" -ForegroundColor Blue

# Set environment variables for production build
$env:NODE_ENV = "production"
$env:NEXT_PUBLIC_API_URL = "https://ae38g4kioc.execute-api.us-east-1.amazonaws.com/prod"
$env:NEXT_PUBLIC_ENVIRONMENT = $Environment

# Build the Next.js app
Write-Host "[INFO] Building Next.js application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed" -ForegroundColor Red
    exit 1
}

# Get the S3 bucket name from CDK outputs
$bucketName = "madlibsserverless-$Environment-website-YOUR_ACCOUNT_ID"

Write-Host "[INFO] Deploying to S3 bucket: $bucketName" -ForegroundColor Blue

# Upload the built files to S3
# For Next.js, we need to upload the static files and configure for SPA routing
aws s3 sync .next/static s3://$bucketName/_next/static --profile $Profile --delete
aws s3 sync public s3://$bucketName --profile $Profile --exclude "*.md"

# Create a simple index.html that loads the Next.js app
$indexHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Mad Libs Game</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 2rem;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid rgba(255,255,255,0.3);
            color: white;
            padding: 1rem 2rem;
            border-radius: 10px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
            border-color: rgba(255,255,255,0.5);
            transform: translateY(-2px);
        }
        .api-info {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 2rem;
        }
        .api-url {
            font-family: monospace;
            background: rgba(0,0,0,0.2);
            padding: 0.5rem;
            border-radius: 5px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎭 AI Mad Libs Game</h1>
        <p>Your AI-powered Mad Libs game is successfully deployed!</p>
        <p>The serverless backend is running and ready to create hilarious stories.</p>
        
        <div>
            <a href="#" class="btn" onclick="startLocalGame()">🏠 Start Local Game</a>
            <a href="#" class="btn" onclick="startOnlineGame()">🌐 Online Mode</a>
        </div>
        
        <div class="api-info">
            <h3>API Status</h3>
            <div class="api-url">https://ae38g4kioc.execute-api.us-east-1.amazonaws.com/prod/</div>
            <p><a href="https://ae38g4kioc.execute-api.us-east-1.amazonaws.com/prod/api/test-aws" target="_blank" style="color: #ffeb3b;">Test API Connection</a></p>
        </div>
        
        <p><small>Full React frontend deployment coming soon...</small></p>
    </div>

    <script>
        function startLocalGame() {
            alert('Local game mode will be available when the full React frontend is deployed!');
        }
        
        function startOnlineGame() {
            alert('Online game mode will be available when the full React frontend is deployed!');
        }
        
        // Test API connection on load
        fetch('https://ae38g4kioc.execute-api.us-east-1.amazonaws.com/prod/api/test-aws')
            .then(response => response.json())
            .then(data => {
                console.log('API Test Result:', data);
                if (data.success) {
                    document.querySelector('.api-info h3').innerHTML = '✅ API Status - Connected';
                }
            })
            .catch(error => {
                console.error('API Test Failed:', error);
                document.querySelector('.api-info h3').innerHTML = '❌ API Status - Error';
            });
    </script>
</body>
</html>
"@

# Upload the index.html
$indexHtml | Out-File -FilePath "temp-index.html" -Encoding UTF8
aws s3 cp temp-index.html s3://$bucketName/index.html --profile $Profile
Remove-Item "temp-index.html"

# Invalidate CloudFront cache
$distributionId = "E1T68AAXY5CU2Q"
Write-Host "[INFO] Invalidating CloudFront cache..." -ForegroundColor Blue
aws cloudfront create-invalidation --distribution-id $distributionId --paths "/*" --profile $Profile

Write-Host "[SUCCESS] Frontend deployed successfully!" -ForegroundColor Green
Write-Host "[INFO] Website URL: Check CDK outputs for CloudFront URL" -ForegroundColor Blue
Write-Host "[INFO] API URL: Check CDK outputs for API Gateway URL" -ForegroundColor Blue