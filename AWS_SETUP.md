# AWS Setup Guide

## Secure AWS Credentials Setup

### Option 1: Environment Variables (Development)

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get AWS credentials:**
   - Go to AWS Console → IAM → Users → Create User
   - Attach policies: `AmazonBedrockFullAccess`, `AmazonS3FullAccess`
   - Create access key → Copy Access Key ID and Secret Access Key

3. **Update `.env.local` with your credentials:**
   ```env
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=abc123...
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your-unique-bucket-name
   ```

### Option 2: AWS IAM Roles (Production - Recommended)

For production deployment, use IAM roles instead of hardcoded credentials:

#### On AWS (EC2, ECS, Lambda):
- Attach IAM role with Bedrock and S3 permissions
- Remove AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from environment
- AWS SDK will automatically use the role

#### On Vercel/Netlify:
- Use their secure environment variable storage
- Never commit credentials to git

### Option 3: AWS CLI Profile (Local Development)

1. **Install AWS CLI:**
   ```bash
   # macOS
   brew install awscli
   
   # Windows
   # Download from AWS website
   ```

2. **Configure profile:**
   ```bash
   aws configure --profile madlibs
   ```

3. **Update services to use profile:**
   ```typescript
   // In ImageGenerator.ts and StoryGenerator.ts
   const credentials = fromIni({ profile: 'madlibs' })
   ```

## Required AWS Permissions

Create an IAM policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
                "arn:aws:bedrock:*::foundation-model/amazon.nova-canvas-v1:0"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

## S3 Bucket Setup

1. **Create S3 bucket:**
   ```bash
   aws s3 mb s3://your-unique-bucket-name
   ```

2. **Set CORS policy for web access:**
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": []
       }
   ]
   ```

## Security Best Practices

✅ **DO:**
- Use IAM roles in production
- Rotate access keys regularly
- Use least-privilege permissions
- Store credentials in secure environment variables
- Use AWS Secrets Manager for production

❌ **DON'T:**
- Commit credentials to git
- Use root account credentials
- Share credentials in plain text
- Use overly broad permissions

## Testing the Setup

Run the app in development mode:
```bash
npm run dev
```

Check the console - if you see "Using mock generators" it means credentials aren't configured. If you see actual AWS API calls, you're connected!

## Troubleshooting

- **"Credentials not found"**: Check your `.env.local` file
- **"Access denied"**: Verify IAM permissions
- **"Region not found"**: Set AWS_REGION in environment
- **"Bucket not found"**: Create the S3 bucket first