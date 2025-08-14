# Environment Setup Guide

This guide walks you through setting up your local environment for the AI Mad Libs application.

## Quick Start

### 1. Copy Environment Template
```bash
# Copy the example file to create your local configuration
cp .env.local.example .env.local
```

### 2. Configure AWS Credentials
Follow the steps below to populate your `.env.local` file with the correct values.

## Detailed Setup Instructions

### 🔐 Step 1: AWS Account Setup

#### Create AWS Account (if needed)
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Click "Create an AWS Account"
3. Follow the registration process
4. **Important**: Enable billing alerts to monitor costs

#### Create IAM User for Local Development
**⚠️ Never use your root AWS account credentials!**

1. **Sign in to AWS Console** → Go to IAM service
2. **Create User**:
   - Click "Users" → "Create user"
   - Username: `mad-libs-local-dev` (or your preference)
   - Select "Provide user access to the AWS Management Console" if you want console access
3. **Set Permissions**:
   - Choose "Attach policies directly"
   - Add these policies:
     - `AmazonBedrockFullAccess` (for AI models)
     - `AmazonS3FullAccess` (for image storage)
     - `CloudWatchLogsFullAccess` (for logging)
4. **Create Access Keys**:
   - Go to the user → "Security credentials" tab
   - Click "Create access key"
   - Choose "Local code" use case
   - Copy the Access Key ID and Secret Access Key

### 🔧 Step 2: Configure .env.local

Open your `.env.local` file and fill in these values:

#### AWS Credentials
```bash
# Replace with your IAM user credentials
AWS_ACCESS_KEY_ID=AKIA_YOUR_ACTUAL_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=your_actual_secret_access_key_here
AWS_REGION=us-east-1  # or your preferred region
```

#### S3 Bucket Name
```bash
# Choose a globally unique name
# Format: ai-mad-libs-media-{initials}-{year}
S3_BUCKET_NAME=ai-mad-libs-media-jd-2025
```
**Examples**:
- `ai-mad-libs-media-john-2025`
- `ai-mad-libs-media-acme-dev-2025`
- `ai-mad-libs-media-team1-2025`

#### Deployment Profile
```bash
# This will be configured later
AWS_DEPLOYMENT_PROFILE=mad-libs-deploy
```

### 🤖 Step 3: Enable Amazon Bedrock Models

Amazon Bedrock models need to be enabled in your AWS account:

1. **Go to Amazon Bedrock Console**
2. **Navigate to "Model access"** in the left sidebar
3. **Request access** to these models:
   - ✅ **Amazon Nova Lite** (for story generation)
   - ✅ **Amazon Nova Canvas** (for image generation)
4. **Wait for approval** (usually instant for Nova models)

### 🚀 Step 4: Test Your Configuration

```bash
# Install dependencies
npm install

# Test AWS connectivity
npm run test:aws

# Start local development
npm run dev
```

If everything works, you should see:
- ✅ AWS credentials validated
- ✅ Bedrock models accessible
- ✅ S3 bucket created (if it doesn't exist)
- ✅ Local server running on http://localhost:3000

## Configuration Examples

### Example 1: Personal Development
```bash
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=ai-mad-libs-media-john-2025
AWS_DEPLOYMENT_PROFILE=mad-libs-deploy
```

### Example 2: Team Development
```bash
AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE
AWS_SECRET_ACCESS_KEY=je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
AWS_REGION=us-west-2
S3_BUCKET_NAME=ai-mad-libs-media-acme-team-2025
AWS_DEPLOYMENT_PROFILE=acme-mad-libs-deploy
```

### Example 3: Different Region
```bash
AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE
AWS_SECRET_ACCESS_KEY=je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
AWS_REGION=eu-west-1
S3_BUCKET_NAME=ai-mad-libs-media-eu-dev-2025
AWS_DEPLOYMENT_PROFILE=mad-libs-deploy-eu
```

## Deployment User Setup

For production deployments, you'll need a separate deployment user:

### Option 1: Automated Setup (Recommended)
```bash
npm run setup:deploy-user
```

### Option 2: Manual Setup
1. Create IAM user: `mad-libs-cdk-deploy`
2. Attach the deployment policy (see `iam-policies/cdk-deploy-user-policy-restricted.json`)
3. Create AWS profile:
   ```bash
   aws configure --profile mad-libs-deploy
   ```

### Configure Deployment Profile
```bash
# Interactive configuration
npm run config:deployment

# Verify setup
npm run verify:deploy-user
```

## Troubleshooting

### Common Issues

#### ❌ "AWS credentials not configured"
**Solution**: Check your `.env.local` file has correct `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

#### ❌ "Access denied to Bedrock"
**Solutions**:
1. Enable Bedrock models in AWS Console
2. Check your IAM user has `AmazonBedrockFullAccess` policy
3. Verify you're in a supported region (us-east-1, us-west-2, eu-west-1)

#### ❌ "S3 bucket name already exists"
**Solution**: Choose a different, globally unique bucket name in `.env.local`

#### ❌ "Profile 'mad-libs-deploy' not found"
**Solution**: Set up deployment user:
```bash
npm run setup:deploy-user
# or
npm run config:deployment
```

### Verification Commands

```bash
# Check AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# List S3 buckets
aws s3 ls

# Verify deployment readiness
npm run check:deployment
```

## Security Best Practices

### ✅ Do's
- ✅ Use IAM users, not root account
- ✅ Enable MFA on your AWS account
- ✅ Use least privilege permissions
- ✅ Rotate access keys regularly
- ✅ Monitor AWS costs and usage
- ✅ Keep `.env.local` in `.gitignore`

### ❌ Don'ts
- ❌ Never commit real credentials to git
- ❌ Don't use root account credentials
- ❌ Don't share credentials in chat/email
- ❌ Don't use production credentials for development
- ❌ Don't ignore AWS billing alerts

## Cost Management

### Expected Costs (Development)
- **Bedrock Nova Lite**: ~$0.0008 per 1K tokens (~$0.01 per story)
- **Bedrock Nova Canvas**: ~$0.04 per image
- **S3 Storage**: ~$0.023 per GB/month
- **Lambda**: Free tier covers development usage
- **DynamoDB**: Free tier covers development usage

### Cost Optimization Tips
- 🔄 Images auto-delete after 1 day
- 🎯 Use pay-per-request billing
- 📊 Set up billing alerts
- 🧪 Use mock services for testing when possible

## Next Steps

Once your environment is set up:

1. **Test locally**: `npm run dev`
2. **Run tests**: `npm test`
3. **Set up deployment**: `npm run setup:deploy-user`
4. **Deploy to AWS**: `npm run deploy:dev`

## Getting Help

- 📖 **Documentation**: Check `docs/` folder
- 🔧 **Configuration**: `npm run config:deployment`
- ✅ **Verification**: `npm run verify:deploy-user`
- 🧪 **Testing**: `npm run check:deployment`

For AWS-specific issues, check the [AWS Documentation](https://docs.aws.amazon.com/) or [AWS Support](https://aws.amazon.com/support/).