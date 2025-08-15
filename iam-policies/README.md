# IAM Policies for AWS Mad Libs Serverless Application

This directory contains the IAM policy needed for deploying and managing the AWS Mad Libs serverless application using AWS CDK.

## 🚀 CDK Deployment User Policy

### Purpose
The `cdk-deploy-user-policy.json` provides the minimum required permissions for deploying the complete serverless infrastructure using AWS CDK.

### What it can do:
- ✅ **CloudFormation**: Create/update/delete CDK stacks and changesets
- ✅ **Lambda Functions**: Deploy and manage all serverless functions
- ✅ **DynamoDB**: Create tables, indexes, and manage scaling
- ✅ **S3 Buckets**: Create buckets for static hosting and media storage
- ✅ **API Gateway**: Set up REST API endpoints with CORS and throttling
- ✅ **CloudFront**: Configure CDN distributions with Origin Access Control
- ✅ **IAM Roles**: Create and manage Lambda execution roles (scoped)
- ✅ **CloudWatch Logs**: Set up logging and monitoring
- ✅ **Bedrock AI**: Access to Nova Lite, Nova Canvas, and Nova Reel models
- ✅ **Resource Tagging**: Tag resources for organization and cost tracking
- ❌ **Scoped Access**: Limited to MadLibsServerless resources only

### Use Cases:
- Initial CDK bootstrap: `npm run cdk:bootstrap`
- Infrastructure deployment: `npm run cdk:deploy`
- Stack updates and modifications
- Resource cleanup: `npm run cdk:destroy`

## 🏗️ Current Architecture Support

The policy supports the complete serverless architecture:

```
Frontend (Next.js Static) → CloudFront → S3 Static Hosting
                                    ↓
API Gateway → Lambda Functions → DynamoDB
                    ↓
Bedrock AI Services → S3 Media Storage
```

### Supported AWS Services:
- **Compute**: AWS Lambda (5 functions)
- **Storage**: Amazon S3 (website + images + logs)
- **Database**: Amazon DynamoDB (single-table design)
- **API**: Amazon API Gateway (REST API)
- **CDN**: Amazon CloudFront (global distribution)
- **AI**: Amazon Bedrock (Nova Lite, Canvas, Reel)
- **Monitoring**: Amazon CloudWatch Logs
- **Security**: AWS IAM (execution roles)

## 🔧 Setup Instructions

### CDK Deployment User Setup

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
     --policy-document file://iam-policies/cdk-deploy-user-policy.json
   ```

3. **Create Access Keys**:
   ```bash
   aws iam create-access-key --user-name mad-libs-cdk-deploy
   ```

4. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter the access key and secret from step 3
   # Set region to us-east-1 (recommended for Bedrock)
   ```

5. **Verify Setup**:
   ```bash
   npm run verify:deploy-user
   ```

## 🔒 Security Features

### CDK Deployment User Security
- **Resource Scoped**: Limited to MadLibsServerless-* resources only
- **No Admin Access**: Cannot modify other AWS accounts or unrelated resources
- **Least Privilege**: Only permissions needed for CDK deployment and management
- **Audit Trail**: All actions logged in CloudTrail
- **Service-Specific**: Permissions tailored to actual services used in the stack

## 🔐 Automatic Service IAM Permissions

**Important**: The CDK deployment automatically creates minimal IAM roles for each deployed service. You don't need to manage these manually.

### Lambda Function Permissions (Auto-Created)
Each Lambda function gets its own execution role with only the permissions it needs:

- **Story Generation Lambda**: 
  - DynamoDB read/write to game tables
  - Bedrock Nova Lite model invocation
  - CloudWatch Logs write access

- **Image Generation Lambda**:
  - DynamoDB read access for game data
  - Bedrock Nova Canvas model invocation
  - S3 read/write to images bucket
  - CloudWatch Logs write access

- **Video Generation Lambda**:
  - DynamoDB read access for story data
  - Bedrock Nova Reel model invocation
  - S3 read access to images bucket
  - CloudWatch Logs write access

- **Story Fill Lambda**:
  - DynamoDB read/write to game tables
  - CloudWatch Logs write access

- **Test AWS Lambda**:
  - Bedrock model listing permissions
  - CloudWatch Logs write access

### Service-to-Service Permissions (Auto-Configured)
- **API Gateway** → **Lambda**: Automatic invocation permissions
- **CloudFront** → **S3**: Origin Access Control for secure bucket access
- **Lambda** → **DynamoDB**: Scoped table access with least privilege
- **Lambda** → **Bedrock**: Model-specific invocation permissions only

**Key Benefit**: All service permissions follow the principle of least privilege and are automatically managed by CDK.

## 📋 Comprehensive Permissions Breakdown

### Core Infrastructure
```json
{
  "CloudFormation": [
    "Full stack management for MadLibsServerless stacks",
    "Template validation and stack events"
  ],
  "IAM": [
    "Lambda execution role creation and management",
    "Service-linked role creation for CloudFront",
    "Role policy attachment and management"
  ],
  "S3": [
    "Bucket creation and management for website/images/logs",
    "Object lifecycle management",
    "Public access block configuration"
  ]
}
```

### Compute & API
```json
{
  "Lambda": [
    "Function creation, updates, and deletion",
    "Layer management and event source mapping",
    "Environment variable configuration"
  ],
  "API Gateway": [
    "REST API creation and configuration",
    "Resource and method management",
    "CORS and throttling setup"
  ]
}
```

### Data & AI Services
```json
{
  "DynamoDB": [
    "Table and index creation/management",
    "Stream configuration",
    "Auto-scaling setup"
  ],
  "Bedrock": [
    "Nova Lite (story generation)",
    "Nova Canvas (image generation)", 
    "Nova Reel (video generation)",
    "Model invocation and streaming"
  ]
}
```

### CDN & Monitoring
```json
{
  "CloudFront": [
    "Distribution creation and management",
    "Origin Access Control configuration",
    "Cache behavior setup"
  ],
  "CloudWatch": [
    "Log group creation for Lambda/API Gateway",
    "Metric and alarm configuration"
  ]
}
```

## 🧪 Testing Permissions

### Verify CDK Deployment User
```bash
# Test AWS CLI access
aws sts get-caller-identity

# Test Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Test CDK synthesis (no deployment)
npm run cdk:synth

# Run comprehensive deployment readiness check
npm run verify:deploy-user

# Test CDK bootstrap (if not done)
npm run cdk:bootstrap
```

### Test Actual Deployment
```bash
# Deploy the full stack
npm run cdk:deploy

# Test deployed API endpoints
curl https://your-api-gateway-url/prod/api/test-aws

# Clean up (optional)
npm run cdk:destroy
```

## 🚨 Troubleshooting

### Common Issues

#### "Access Denied" for CDK Operations
- ✅ Check AWS CLI is configured: `aws configure list`
- ✅ Verify IAM user has the CDK deploy policy attached
- ✅ Ensure you're in the correct AWS region (us-east-1 recommended)
- ✅ Run CDK bootstrap if not done: `npm run cdk:bootstrap`

#### "Bedrock Model Not Found" Errors
- ✅ Ensure Bedrock models are enabled in us-east-1 region
- ✅ Check AWS console → Bedrock → Model access
- ✅ Request access to Nova models if needed

#### "Stack Already Exists" Errors
- ✅ Check existing stacks: `aws cloudformation list-stacks`
- ✅ Use different stack name or delete existing stack
- ✅ Verify CDK context: `npm run cdk:ls`

#### "CloudFront Distribution" Issues
- ✅ CloudFront operations can take 15-20 minutes
- ✅ Check distribution status in AWS console
- ✅ Verify Origin Access Control permissions

### Policy Updates

If you need to update the deployment policy:

1. **Edit the JSON file**: `iam-policies/cdk-deploy-user-policy.json`
2. **Update the IAM user policy**:
   ```bash
   aws iam put-user-policy \
     --user-name mad-libs-cdk-deploy \
     --policy-name MadLibsCDKDeployPolicy \
     --policy-document file://iam-policies/cdk-deploy-user-policy.json
   ```
3. **Test the updated permissions**:
   ```bash
   npm run verify:deploy-user
   ```

## 📚 Additional Resources

- 📖 [Main README](../README.md) - Project overview and setup
- 🚀 [Development Roadmap](../ROADMAP.md) - Future features and timeline
- 🔧 [Environment Setup Guide](../docs/ENVIRONMENT_SETUP.md)
- ☁️ [Serverless Deployment Guide](../docs/SERVERLESS_DEPLOYMENT.md)
- 🏗️ [CDK Stack Documentation](../cdk/README.md)

## 🔐 Security Best Practices

- ✅ **Rotate access keys** every 90 days
- ✅ **Use dedicated deployment user** (not personal AWS account)
- ✅ **Monitor usage** through CloudTrail and AWS Cost Explorer
- ✅ **Enable MFA** on your AWS root account
- ✅ **Review permissions** regularly and remove unused access
- ✅ **Use least privilege principle** - only grant necessary permissions
- ❌ **Never share credentials** in chat, email, or documentation
- ❌ **Don't commit credentials** to git repositories
- ❌ **Avoid using root account** for deployment operations
- ❌ **Don't use overly broad policies** like AdministratorAccess

## 🎯 Policy Maintenance

This policy is actively maintained to support:
- ✅ **Current Architecture**: All services in the deployed stack
- ✅ **Future Roadmap**: Permissions for planned Phase 1-2 features
- ✅ **Security Updates**: Regular reviews and permission refinements
- ✅ **AWS Service Updates**: New features and API changes

**Last Updated**: August 15, 2025 (v2.3.1)  
**Next Review**: September 15, 2025