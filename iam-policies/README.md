# IAM Policies for Mad Libs Application

This directory contains IAM policies for different types of users needed for the Mad Libs application.

## 👥 Two Types of Users

### 1. 🧪 Local App User (`local-app-user-policy.json`)
**Purpose**: For running the application locally during development and testing.

**What it can do**:
- ✅ **Bedrock AI Models**: Invoke Nova Lite and Nova Canvas for story/image generation
- ✅ **S3 Media Storage**: Read/write to your media bucket for images
- ❌ **No Infrastructure**: Cannot create/modify AWS infrastructure

**Use cases**:
- Running `npm run dev` locally
- Testing AI story and image generation
- Local development and debugging

### 2. 🚀 Deployment User (`cdk-deploy-user-policy-restricted.json`)
**Purpose**: For deploying the serverless infrastructure using AWS CDK.

**What it can do**:
- ✅ **CloudFormation**: Create/update/delete CDK stacks
- ✅ **Lambda Functions**: Deploy and manage serverless functions
- ✅ **DynamoDB**: Create tables and indexes
- ✅ **S3 Buckets**: Create buckets for static hosting and storage
- ✅ **API Gateway**: Set up REST API endpoints
- ✅ **CloudFront**: Configure CDN distributions
- ✅ **IAM Roles**: Create roles for Lambda functions (scoped)
- ✅ **CloudWatch**: Set up logging and monitoring
- ❌ **Scoped Access**: Limited to Mad Libs resources only

**Use cases**:
- Running `npm run deploy:dev`
- CDK bootstrap operations
- Infrastructure updates and deployments

## 🔧 Setup Instructions

### Local App User Setup

1. **Create IAM User**:
   ```bash
   aws iam create-user --user-name mad-libs-local-dev
   ```

2. **Attach Policy**:
   ```bash
   aws iam put-user-policy \
     --user-name mad-libs-local-dev \
     --policy-name MadLibsLocalAppPolicy \
     --policy-document file://iam-policies/local-app-user-policy.json
   ```

3. **Create Access Keys**:
   ```bash
   aws iam create-access-key --user-name mad-libs-local-dev
   ```

4. **Add to `.env.local`**:
   ```bash
   AWS_ACCESS_KEY_ID=your_access_key_here
   AWS_SECRET_ACCESS_KEY=your_secret_key_here
   ```

### Deployment User Setup

#### Option 1: Automated Setup (Recommended)
```bash
npm run setup:deploy-user
```

#### Option 2: Manual Setup

1. **Create IAM User**:
   ```bash
   aws iam create-user --user-name mad-libs-cdk-deploy
   ```

2. **Attach Policy**:
   ```bash
   aws iam put-user-policy \
     --user-name mad-libs-cdk-deploy \
     --policy-name MadLibsCDKDeployPolicy \
     --policy-document file://iam-policies/cdk-deploy-user-policy-restricted.json
   ```

3. **Create Access Keys**:
   ```bash
   aws iam create-access-key --user-name mad-libs-cdk-deploy
   ```

4. **Configure AWS Profile**:
   ```bash
   aws configure --profile mad-libs-deploy
   # Enter the access key and secret from step 3
   ```

5. **Update `.env.local`**:
   ```bash
   AWS_DEPLOYMENT_PROFILE=mad-libs-deploy
   ```

## 🔒 Security Features

### Local App User Security
- **Minimal Permissions**: Only what's needed to run the app
- **No Infrastructure Access**: Cannot modify AWS resources
- **Scoped to Media Bucket**: Limited S3 access
- **AI Model Access Only**: Cannot access other Bedrock features

### Deployment User Security
- **Resource Scoped**: Limited to Mad Libs resources only
- **No Admin Access**: Cannot modify other AWS accounts/resources
- **Least Privilege**: Only permissions needed for CDK deployment
- **Audit Trail**: All actions logged in CloudTrail

## 📋 Permissions Breakdown

### Local App User Permissions
```json
{
  "Bedrock": [
    "bedrock:InvokeModel"
  ],
  "S3": [
    "s3:PutObject",
    "s3:GetObject", 
    "s3:DeleteObject",
    "s3:ListBucket"
  ]
}
```

### Deployment User Permissions
```json
{
  "CloudFormation": ["Full stack management"],
  "Lambda": ["Function lifecycle management"],
  "DynamoDB": ["Table and index management"],
  "S3": ["Bucket lifecycle management"],
  "API Gateway": ["REST API management"],
  "CloudFront": ["Distribution management"],
  "IAM": ["Role management (scoped)"],
  "CloudWatch": ["Logging setup"],
  "SSM": ["Parameter management"],
  "Secrets Manager": ["Secret management"],
  "STS": ["Role assumption"],
  "ECR": ["Container registry access"]
}
```

## 🧪 Testing Permissions

### Test Local App User
```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=your_local_key
export AWS_SECRET_ACCESS_KEY=your_local_secret

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Test S3 access
aws s3 ls s3://your-bucket-name
```

### Test Deployment User
```bash
# Test with profile
aws sts get-caller-identity --profile mad-libs-deploy

# Test CDK permissions
npx cdk synth --profile mad-libs-deploy

# Run deployment readiness check
npm run verify:deploy-user
```

## 🚨 Troubleshooting

### Common Issues

#### "Access Denied" for Local App
- ✅ Check `.env.local` has correct credentials
- ✅ Verify IAM user has the local app policy attached
- ✅ Ensure Bedrock models are enabled in your region

#### "Access Denied" for Deployment
- ✅ Check AWS profile is configured: `aws configure list --profile mad-libs-deploy`
- ✅ Verify deployment user has the CDK policy attached
- ✅ Run CDK bootstrap if not done: `npx cdk bootstrap`

#### "Stack name mismatch" Errors
- ✅ Ensure policy resource ARNs match your stack naming
- ✅ Check environment-specific stack names (dev/staging/prod)

### Policy Updates

If you need to update policies:

1. **Edit the JSON files** in this directory
2. **Update the IAM user policies**:
   ```bash
   # Update local app policy
   aws iam put-user-policy \
     --user-name mad-libs-local-dev \
     --policy-name MadLibsLocalAppPolicy \
     --policy-document file://iam-policies/local-app-user-policy.json

   # Update deployment policy  
   aws iam put-user-policy \
     --user-name mad-libs-cdk-deploy \
     --policy-name MadLibsCDKDeployPolicy \
     --policy-document file://iam-policies/cdk-deploy-user-policy-restricted.json
   ```

## 📚 Additional Resources

- 📖 [Environment Setup Guide](../docs/ENVIRONMENT_SETUP.md)
- 🚀 [Deployment User Setup](../DEPLOYMENT_USER_SETUP.md)
- 🔧 [Local Configuration Guide](../docs/LOCAL_CONFIG.md)
- ☁️ [Serverless Deployment Guide](../docs/SERVERLESS_DEPLOYMENT.md)

## 🔐 Security Best Practices

- ✅ **Rotate access keys** every 90 days
- ✅ **Use separate users** for different purposes
- ✅ **Monitor usage** through CloudTrail
- ✅ **Enable MFA** on your AWS root account
- ✅ **Review permissions** regularly
- ❌ **Never share credentials** in chat/email
- ❌ **Don't commit credentials** to git
- ❌ **Avoid using root account** for daily operations