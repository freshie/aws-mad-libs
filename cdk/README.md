# Mad Libs Serverless CDK Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the Mad Libs game as a serverless application.

## Architecture Overview

The serverless architecture includes:
- **DynamoDB** - Game session and player data storage
- **Lambda Functions** - API endpoints for story/image generation
- **API Gateway** - RESTful API management
- **S3 + CloudFront** - Static website hosting with global CDN
- **IAM Roles** - Secure service-to-service authentication

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Node.js** and **npm** installed
3. **AWS CDK CLI** installed globally: `npm install -g aws-cdk`

## Quick Start

1. **Bootstrap CDK** (first time only):
   ```bash
   npm run cdk:bootstrap
   ```

2. **Deploy the infrastructure**:
   ```bash
   npm run deploy:serverless
   ```

3. **View the synthesized CloudFormation**:
   ```bash
   npm run cdk:synth
   ```

## Available Commands

- `npm run cdk:synth` - Generate CloudFormation templates
- `npm run cdk:deploy` - Deploy the stack
- `npm run cdk:destroy` - Delete all resources
- `npm run cdk:diff` - Show differences between deployed and local
- `npm run deploy:serverless` - Full deployment with validation

## Development Workflow

1. Make changes to CDK code in the `cdk/` directory
2. Test locally with `npm run cdk:synth`
3. Deploy with `npm run cdk:deploy`
4. Monitor resources in AWS Console

## Stack Structure

- **`app.ts`** - CDK app entry point
- **`mad-libs-serverless-stack.ts`** - Main infrastructure stack
- **`cdk.json`** - CDK configuration and feature flags

## Environment Variables

The stack uses these environment variables:
- `CDK_DEFAULT_ACCOUNT` - AWS account ID
- `CDK_DEFAULT_REGION` - AWS region (defaults to us-east-1)
- `NODE_ENV` - Environment tag for resources

## Cost Optimization

The infrastructure is designed for cost efficiency:
- **Pay-per-request** DynamoDB billing
- **Lambda** charges only for execution time
- **S3** with lifecycle policies
- **CloudFront** with optimized caching

## Security

- **Least-privilege IAM roles** for all services
- **VPC** configuration for enhanced security
- **WAF** protection for web applications
- **Secrets Manager** for sensitive configuration

## Monitoring

Built-in observability includes:
- **CloudWatch** logs and metrics
- **X-Ray** distributed tracing
- **Custom dashboards** for business metrics
- **Automated alerts** for error conditions