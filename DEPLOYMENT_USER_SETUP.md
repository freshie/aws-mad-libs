# CDK Deployment User Setup Guide

This guide helps you create a dedicated IAM user with appropriate permissions for deploying the Mad Libs serverless application using AWS CDK.

## Why a Deployment User?

Creating a dedicated deployment user follows security best practices:
- **Principle of Least Privilege** - Only permissions needed for deployment
- **Separation of Concerns** - Different credentials for development vs deployment
- **Audit Trail** - Clear tracking of deployment activities
- **Team Collaboration** - Shared deployment credentials for CI/CD

## Quick Setup (Recommended)

### Option 1: PowerShell Script (Windows)
```powershell
# Run the automated setup script
powershell -ExecutionPolicy Bypass -File scripts/create-deploy-user.ps1
```

### Option 2: Bash Script (Linux/Mac)
```bash
# Make script executable and run
chmod +x scripts/create-deploy-user.sh
./scripts/create-deploy-user.sh
```

### Option 3: CloudFormation Template
```bash
# Deploy using AWS CLI
aws cloudformation create-stack \
  --stack-name mad-libs-deploy-user \
  --template-body file://cloudformation/deploy-user-stack.yaml \
  --capabilities CAPABILITY_NAMED_IAM

# Get the credentials from stack outputs
aws cloudformation describe-stacks \
  --stack-name mad-libs-deploy-user \
  --query 'Stacks[0].Outputs'
```

## Manual Setup Steps

If you prefer to create the user manually:

### 1. Create IAM Policy
```bash
aws iam create-policy \
  --policy-name MadLibsCDKDeployPolicy \
  --policy-document file://iam-policies/cdk-deploy-user-policy-restricted.json
```

### 2. Create IAM Group
```bash
aws iam create-group --group-name mad-libs-deployers
aws iam attach-group-policy \
  --group-name mad-libs-deployers \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT:policy/MadLibsCDKDeployPolicy
```

### 3. Create IAM User
```bash
aws iam create-user --user-name mad-libs-cdk-deploy
aws iam add-user-to-group \
  --group-name mad-libs-deployers \
  --user-name mad-libs-cdk-deploy
```

### 4. Create Access Keys
```bash
aws iam create-access-key --user-name mad-libs-cdk-deploy
```

## Configure AWS Profile

After creating the user, configure a dedicated AWS profile:

```bash
# Configure the deployment profile
aws configure --profile mad-libs-deploy
# Enter the Access Key ID and Secret Access Key from above
# Region: us-east-1 (or your preferred region)
# Output format: json
```

## Using the Deployment User

### Set the AWS Profile
```bash
# Linux/Mac
export AWS_PROFILE=mad-libs-deploy

# Windows PowerShell
$env:AWS_PROFILE = "mad-libs-deploy"

# Windows CMD
set AWS_PROFILE=mad-libs-deploy
```

### Deploy with CDK
```bash
# Bootstrap CDK (first time only)
npm run cdk:bootstrap

# Deploy the application
npm run cdk:deploy
```

## Permissions Included

The deployment user has the following scoped permissions:

### Core CDK Permissions
- **CloudFormation** - Create/update/delete CDK stacks
- **IAM** - Manage roles for Lambda functions (scoped to stack resources)
- **S3** - Manage CDK assets and application buckets
- **SSM** - Access CDK bootstrap parameters

### Application-Specific Permissions
- **Lambda** - Create and manage serverless functions
- **API Gateway** - Set up REST API endpoints
- **DynamoDB** - Create and manage game data tables
- **CloudFront** - Set up CDN for static assets
- **CloudWatch** - Create log groups and monitoring
- **Bedrock** - Access AI models for story/image generation

### Security Features
- **Scoped Resources** - Permissions limited to Mad Libs resources
- **No Admin Access** - Cannot modify other AWS resources
- **Audit Logging** - All actions logged in CloudTrail
- **Time-based Access** - Can be configured with temporary credentials

## Security Best Practices

### Credential Management
- **Never commit credentials** to version control
- **Use environment variables** or AWS profiles
- **Rotate access keys** regularly (every 90 days)
- **Monitor usage** through CloudTrail logs

### Access Control
- **Principle of least privilege** - Only necessary permissions
- **Resource-based restrictions** - Limited to specific ARN patterns
- **Regular audits** - Review permissions quarterly
- **MFA enforcement** - Consider requiring MFA for sensitive operations

## Troubleshooting

### Common Issues

**Permission Denied Errors:**
```bash
# Check current identity
aws sts get-caller-identity --profile mad-libs-deploy

# Verify policy attachment
aws iam list-attached-group-policies --group-name mad-libs-deployers
```

**CDK Bootstrap Issues:**
```bash
# Ensure bootstrap permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::ACCOUNT:user/mad-libs-cdk-deploy \
  --action-names cloudformation:CreateStack \
  --resource-arns arn:aws:cloudformation:us-east-1:ACCOUNT:stack/CDKToolkit/*
```

**Access Key Rotation:**
```bash
# List existing keys
aws iam list-access-keys --user-name mad-libs-cdk-deploy

# Create new key
aws iam create-access-key --user-name mad-libs-cdk-deploy

# Delete old key (after updating configuration)
aws iam delete-access-key --user-name mad-libs-cdk-deploy --access-key-id OLD_KEY_ID
```

## CI/CD Integration

For automated deployments, store credentials securely:

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  AWS_DEFAULT_REGION: us-east-1
```

### GitLab CI
```yaml
# .gitlab-ci.yml
variables:
  AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY
  AWS_DEFAULT_REGION: us-east-1
```

## Cleanup

To remove the deployment user and resources:

```bash
# Delete access keys
aws iam list-access-keys --user-name mad-libs-cdk-deploy
aws iam delete-access-key --user-name mad-libs-cdk-deploy --access-key-id KEY_ID

# Remove user from group
aws iam remove-user-from-group --group-name mad-libs-deployers --user-name mad-libs-cdk-deploy

# Delete user
aws iam delete-user --user-name mad-libs-cdk-deploy

# Delete group
aws iam detach-group-policy --group-name mad-libs-deployers --policy-arn POLICY_ARN
aws iam delete-group --group-name mad-libs-deployers

# Delete policy
aws iam delete-policy --policy-arn POLICY_ARN
```

Or use CloudFormation:
```bash
aws cloudformation delete-stack --stack-name mad-libs-deploy-user
```