# Mad Libs Serverless Deployment Guide

This guide covers deploying the Mad Libs application to AWS using serverless architecture with AWS CDK.

## Architecture Overview

The serverless deployment includes:

- **AWS Lambda Functions**: Story generation, image generation, and API endpoints
- **Amazon DynamoDB**: Game session and player data storage
- **Amazon S3**: Static website hosting and image storage
- **Amazon CloudFront**: Global CDN for fast content delivery
- **Amazon API Gateway**: RESTful API management
- **Amazon Bedrock**: AI services for story and image generation

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
3. **Node.js**: Version 18 or higher
4. **npm**: Package manager for dependencies

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Or set environment variables:
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Bootstrap CDK (First Time Only)

```bash
npm run cdk:bootstrap
```

### 4. Build and Deploy

#### Development Environment
```bash
npm run deploy:dev
```

#### Staging Environment
```bash
npm run deploy:staging
```

#### Production Environment
```bash
npm run deploy:prod
```

## Manual Deployment Steps

### 1. Build Lambda Functions
```bash
npm run build:lambda
```

### 2. Deploy CDK Stack
```bash
npx cdk deploy MadLibsServerless-development
```

### 3. View Deployment Outputs
The deployment will output important URLs and resource names:
- CloudFront Distribution URL
- API Gateway URL
- S3 Bucket Names
- DynamoDB Table Name

## Environment Configuration

### Development
- **Stack Name**: `MadLibsServerless-development`
- **S3 Bucket Lifecycle**: Auto-delete after 7 days
- **DynamoDB**: Pay-per-request billing
- **CloudFront**: Price class 100 (North America + Europe)

### Production
- **Stack Name**: `MadLibsServerless-production`
- **S3 Bucket Lifecycle**: Retain important data
- **DynamoDB**: Auto-scaling enabled
- **CloudFront**: Global distribution

## Cost Optimization

### Estimated Monthly Costs (1000 games)
- **Lambda Functions**: $5-10
- **DynamoDB**: $2-5
- **S3 Storage**: $1-3
- **CloudFront**: $1-5
- **API Gateway**: $3-7
- **Bedrock AI**: $10-20
- **Total**: ~$22-50/month

### Cost-Saving Features
- Pay-per-request billing for DynamoDB
- Automatic image cleanup after 1 day
- CloudFront caching reduces API calls
- Lambda functions only run when needed

## Monitoring and Logging

### CloudWatch Integration
- All Lambda functions log to CloudWatch
- API Gateway access logs enabled
- Custom metrics for business logic
- Automated alarms for error rates

### Available Metrics
- API response times
- Lambda function duration
- DynamoDB read/write capacity
- CloudFront cache hit rates
- Bedrock API usage

## Security Features

### IAM Roles
- Least privilege access for all services
- Separate roles for each Lambda function
- No hardcoded credentials

### Data Protection
- S3 buckets with private access only
- DynamoDB encryption at rest
- CloudFront HTTPS enforcement
- WAF protection for web application

### Data Retention
- Game sessions: 24-hour TTL
- Generated images: 1-day expiry
- Story templates: Permanent storage
- CloudWatch logs: 30-day retention
- Generated images: 1-day expiry

## Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Required
```bash
Error: Need to perform AWS CDK bootstrap
```
**Solution**: Run `npm run cdk:bootstrap`

#### 2. Lambda Build Fails
```bash
Error: Lambda function build failed
```
**Solution**: Check Node.js version and run `npm run build:lambda`

#### 3. AWS Credentials Invalid
```bash
Error: AWS credentials not configured
```
**Solution**: Run `aws configure` or set environment variables

#### 4. Stack Already Exists
```bash
Error: Stack already exists
```
**Solution**: Use `npx cdk diff` to see changes, then `npx cdk deploy`

### Debugging Commands

```bash
# View stack resources
npx cdk ls

# Show deployment diff
npx cdk diff MadLibsServerless-development

# View CloudFormation events
aws cloudformation describe-stack-events --stack-name MadLibsServerless-development

# Check Lambda function logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/MadLibsServerless
```

## Cleanup

### Remove Development Stack
```bash
npx cdk destroy MadLibsServerless-development
```

### Remove All Resources
```bash
# List all stacks
npx cdk ls

# Destroy each stack
npx cdk destroy MadLibsServerless-development
npx cdk destroy MadLibsServerless-staging
npx cdk destroy MadLibsServerless-production
```

## Next Steps

1. **Custom Domain**: Configure Route 53 and ACM certificate
2. **CI/CD Pipeline**: Set up GitHub Actions for automated deployment
3. **Monitoring**: Create custom CloudWatch dashboards
4. **Performance**: Optimize Lambda memory and timeout settings
5. **Security**: Add WAF rules and API authentication

## Support

For deployment issues:
1. Check AWS CloudFormation console for stack events
2. Review CloudWatch logs for Lambda functions
3. Verify AWS credentials and permissions
4. Ensure all prerequisites are installed