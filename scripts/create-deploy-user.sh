#!/bin/bash

# Script to create CDK deployment user with appropriate permissions
set -e

USER_NAME="mad-libs-cdk-deploy"
POLICY_NAME="MadLibsCDKDeployPolicy"
GROUP_NAME="mad-libs-deployers"

echo "🔐 Creating CDK deployment user and permissions..."

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Get current AWS account
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
echo "📋 Working with AWS Account: $ACCOUNT"

# Create IAM policy
echo "📝 Creating IAM policy..."
POLICY_ARN=$(aws iam create-policy \
    --policy-name $POLICY_NAME \
    --policy-document file://iam-policies/cdk-deploy-user-policy-restricted.json \
    --description "Policy for Mad Libs CDK deployment user" \
    --query 'Policy.Arn' \
    --output text 2>/dev/null || \
    aws iam get-policy \
    --policy-arn "arn:aws:iam::$ACCOUNT:policy/$POLICY_NAME" \
    --query 'Policy.Arn' \
    --output text)

echo "✅ Policy created/found: $POLICY_ARN"

# Create IAM group
echo "👥 Creating IAM group..."
aws iam create-group --group-name $GROUP_NAME 2>/dev/null || echo "Group already exists"

# Attach policy to group
echo "🔗 Attaching policy to group..."
aws iam attach-group-policy \
    --group-name $GROUP_NAME \
    --policy-arn $POLICY_ARN

# Create IAM user
echo "👤 Creating IAM user..."
aws iam create-user --user-name $USER_NAME 2>/dev/null || echo "User already exists"

# Add user to group
echo "➕ Adding user to group..."
aws iam add-user-to-group \
    --group-name $GROUP_NAME \
    --user-name $USER_NAME

# Create access keys
echo "🔑 Creating access keys..."
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name $USER_NAME 2>/dev/null || echo "Access key may already exist")

if [[ $ACCESS_KEY_OUTPUT != "Access key may already exist" ]]; then
    ACCESS_KEY_ID=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.AccessKeyId')
    SECRET_ACCESS_KEY=$(echo $ACCESS_KEY_OUTPUT | jq -r '.AccessKey.SecretAccessKey')
    
    echo ""
    echo "🎉 Deployment user created successfully!"
    echo "================================================"
    echo "User Name: $USER_NAME"
    echo "Access Key ID: $ACCESS_KEY_ID"
    echo "Secret Access Key: $SECRET_ACCESS_KEY"
    echo "================================================"
    echo ""
    echo "⚠️  IMPORTANT: Save these credentials securely!"
    echo "💡 Configure them with: aws configure --profile mad-libs-deploy"
    echo ""
    echo "To use this profile for CDK deployment:"
    echo "export AWS_PROFILE=mad-libs-deploy"
    echo "npm run cdk:deploy"
else
    echo "⚠️  User already exists. Access keys not created."
    echo "If you need new access keys, delete existing ones first:"
    echo "aws iam list-access-keys --user-name $USER_NAME"
fi

echo ""
echo "✅ Setup complete! User has permissions for:"
echo "  - CDK bootstrap and deployment"
echo "  - Lambda function management"
echo "  - DynamoDB table operations"
echo "  - S3 bucket management"
echo "  - API Gateway configuration"
echo "  - CloudFront distribution"
echo "  - IAM role management (scoped)"
echo "  - CloudWatch logs"
echo "  - Bedrock AI model access"