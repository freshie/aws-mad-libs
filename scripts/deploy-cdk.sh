#!/bin/bash

# CDK Deployment Script for Mad Libs Serverless App
set -e

echo "🚀 Starting CDK deployment for Mad Libs Serverless App..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get current AWS account and region
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo "📋 Deploying to Account: $ACCOUNT, Region: $REGION"

# Bootstrap CDK if needed
echo "🔧 Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION > /dev/null 2>&1; then
    echo "🔧 Bootstrapping CDK..."
    cdk bootstrap aws://$ACCOUNT/$REGION
else
    echo "✅ CDK already bootstrapped"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Synthesize the stack
echo "🔨 Synthesizing CDK stack..."
cdk synth

# Deploy the stack
echo "🚀 Deploying stack..."
cdk deploy --require-approval never

echo "✅ Deployment completed successfully!"
echo "📊 You can view your resources in the AWS Console"