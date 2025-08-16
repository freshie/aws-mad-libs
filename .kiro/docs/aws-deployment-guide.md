# AWS Deployment Guide for AI Mad Libs

## 🚨 IMPORTANT: This Project Runs on AWS Only

This application is designed to run on AWS infrastructure. **Do not attempt to run locally** - the Lambda functions, S3 buckets, and CloudFront distribution are required for proper operation.

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Node.js 18+** installed
3. **AWS CDK** installed globally: `npm install -g aws-cdk`
4. **PowerShell** (for Windows deployment scripts)

## Deployment Process

### Step 1: Build Lambda Functions
```powershell
# Navigate to lambda directory and build
cd lambda
npm install
npm run build
cd ..
```

### Step 2: Deploy CDK Stack
```powershell
# Deploy the infrastructure
cd cdk
npm install
cdk deploy --require-approval never
cd ..
```

### Step 3: Build and Deploy Frontend
```powershell
# Build the React app
npm install
npm run build

# Sync to S3 bucket (replace with your bucket name)
aws s3 sync dist/ s3://your-mad-libs-bucket --delete

# Create CloudFront invalidation
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Step 4: Verify Deployment
1. Check CloudFront URL in AWS Console
2. Test story generation functionality
3. Verify S3 bucket has all files
4. Check Lambda function logs in CloudWatch

## Environment Configuration

The application uses AWS Parameter Store for configuration:
- `/mad-libs/cloudfront-domain` - CloudFront distribution domain
- `/mad-libs/s3-bucket` - S3 bucket name for assets

## Quick Deployment Script

Use the PowerShell script for complete deployment:

```powershell
# Run the complete deployment
.\scripts\deploy-to-aws.ps1
```

## Troubleshooting

### Common Issues:
1. **Lambda timeout** - Check CloudWatch logs
2. **CORS errors** - Verify API Gateway configuration
3. **Missing assets** - Ensure S3 sync completed
4. **CloudFront caching** - Create invalidation after updates

### Useful Commands:
```powershell
# Check CDK stack status
cd cdk && cdk list

# View Lambda logs
aws logs tail /aws/lambda/mad-libs-story-generation --follow

# Check S3 bucket contents
aws s3 ls s3://your-mad-libs-bucket --recursive

# Get CloudFront distribution info
aws cloudfront list-distributions
```

## Development Workflow

1. Make code changes
2. Test Lambda functions with unit tests: `cd lambda && npm test`
3. Build Lambda functions: `cd lambda && npm run build`
4. Deploy CDK stack: `cd cdk && cdk deploy`
5. Build frontend: `npm run build`
6. Sync to S3: `aws s3 sync dist/ s3://your-bucket --delete`
7. Create CloudFront invalidation
8. Test on live AWS environment

## Security Notes

- All API endpoints are secured with CORS
- Lambda functions have minimal IAM permissions
- S3 bucket is configured for web hosting only
- CloudFront provides HTTPS termination

## Monitoring

- CloudWatch logs for Lambda functions
- CloudFront access logs
- S3 access logs
- AWS X-Ray tracing (if enabled)

---

**Remember: This application requires AWS infrastructure to function properly. Local development is not supported.**