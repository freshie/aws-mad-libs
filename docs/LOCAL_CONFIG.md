# Local Configuration Guide

This guide explains how to configure your local development and deployment settings.

## Configuration Files

### `.env.local` - Local Environment Configuration

This file contains your local development and deployment settings:

```bash
# AWS Configuration for Local Testing
AWS_ACCESS_KEY_ID=your_local_access_key
AWS_SECRET_ACCESS_KEY=your_local_secret_key
AWS_REGION=us-east-1

# Bedrock Model Configuration
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_IMAGE_MODEL_ID=amazon.nova-canvas-v1:0

# S3 Configuration
S3_BUCKET_NAME=your-unique-bucket-name

# Environment
NODE_ENV=development

# Deployment Configuration
AWS_DEPLOYMENT_PROFILE=mad-libs-deploy
```

## Dual Configuration Setup

### 🧪 Local Testing Configuration
- **Uses**: Direct AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
- **Purpose**: Running the app locally, testing API endpoints
- **Commands**: `npm run dev`, `npm test`, `npm run build`

### 🚀 Deployment Configuration  
- **Uses**: AWS Profile (`AWS_DEPLOYMENT_PROFILE`)
- **Purpose**: Deploying to AWS with CDK
- **Commands**: `npm run deploy:dev`, `npm run deploy:prod`

## Setup Instructions

### 1. Configure Local Testing
Your local testing credentials are already set up in `.env.local`. These are used when running the app locally.

### 2. Configure Deployment Profile

#### Option A: Use Configuration Script (Recommended)
```bash
# Interactive configuration
npm run config:deployment

# List available profiles
npm run config:deployment -- -List

# Set specific profile
npm run config:deployment -- -ProfileName my-deploy-profile
```

#### Option B: Manual Configuration
1. Edit `.env.local` and update:
   ```bash
   AWS_DEPLOYMENT_PROFILE=your-deployment-profile-name
   ```

2. Ensure the profile exists:
   ```bash
   aws configure --profile your-deployment-profile-name
   ```

### 3. Verify Setup
```bash
# Check deployment user configuration
npm run verify:deploy-user

# Check overall deployment readiness
npm run check:deployment
```

## Usage Examples

### Local Development
```bash
# Uses AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY from .env.local
npm run dev
npm test
```

### Deployment
```bash
# Uses AWS_DEPLOYMENT_PROFILE from .env.local
npm run deploy:dev
npm run deploy:prod
```

### Override Deployment Profile
```bash
# Use different profile for one deployment
.\scripts\deploy.ps1 -Environment development -Profile my-other-profile
```

## Profile Management

### List Available Profiles
```bash
aws configure list-profiles
```

### Create New Profile
```bash
aws configure --profile new-profile-name
```

### Test Profile
```bash
aws sts get-caller-identity --profile profile-name
```

## Security Best Practices

### Local Testing Credentials
- ✅ **Keep in .env.local** (gitignored)
- ✅ **Use IAM user with limited permissions**
- ✅ **Rotate regularly**
- ❌ **Never commit to git**

### Deployment Profile
- ✅ **Use dedicated deployment user**
- ✅ **Least privilege permissions**
- ✅ **Separate from personal AWS account**
- ✅ **Audit deployment activities**

## Troubleshooting

### "Profile not found" Error
```bash
# List profiles to see what's available
aws configure list-profiles

# Create the missing profile
aws configure --profile mad-libs-deploy

# Or update your configuration
npm run config:deployment
```

### "Invalid credentials" Error
```bash
# Test the profile
aws sts get-caller-identity --profile mad-libs-deploy

# Reconfigure if needed
aws configure --profile mad-libs-deploy
```

### Local Testing Not Working
1. Check `.env.local` has correct credentials
2. Test credentials:
   ```bash
   # Set environment variables temporarily
   $env:AWS_ACCESS_KEY_ID = "your-key"
   $env:AWS_SECRET_ACCESS_KEY = "your-secret"
   aws sts get-caller-identity
   ```

## Configuration Reference

### Environment Variables (Local Testing)
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key  
- `AWS_REGION` - AWS region (default: us-east-1)
- `NODE_ENV` - Environment (development/production)
- `S3_BUCKET_NAME` - Your S3 bucket for images

### Deployment Configuration
- `AWS_DEPLOYMENT_PROFILE` - AWS profile for deployments
- Deployment scripts automatically use this profile
- Can be overridden with `-Profile` parameter

This setup gives you the flexibility to:
- 🧪 **Test locally** with your personal credentials
- 🚀 **Deploy safely** with a dedicated deployment user
- 🔄 **Switch profiles** easily for different environments
- 👥 **Share deployment setup** with your team