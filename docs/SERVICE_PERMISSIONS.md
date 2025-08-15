# AWS Service-to-Service Permissions

This document outlines the IAM permissions configured for AWS services to communicate with each other in the Mad Libs serverless application.

## 🔗 Service Communication Matrix

### Lambda Functions → Other Services

#### ✅ **Lambda → DynamoDB** (Configured)
```typescript
// Story Generation & Fill Functions
table.grantReadWriteData(storyGenerationFunction);
table.grantReadWriteData(storyFillFunction);

// Image Generation & Test Functions  
table.grantReadData(imageGenerationFunction);
table.grantReadData(testAwsFunction);
```

**Permissions Granted**:
- `dynamodb:GetItem`
- `dynamodb:PutItem` 
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Query`
- `dynamodb:Scan`

#### ✅ **Lambda → Bedrock** (Configured)
```typescript
const bedrockPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'bedrock:InvokeModel',
    'bedrock:ListFoundationModels', 
    'bedrock:GetFoundationModel',
  ],
  resources: [
    'arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0',
    'arn:aws:bedrock:*::foundation-model/amazon.nova-canvas-v1:0',
    'arn:aws:bedrock:*::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
  ],
});

// Applied to story and image generation functions
storyGenerationFunction.addToRolePolicy(bedrockPolicy);
storyFillFunction.addToRolePolicy(bedrockPolicy);
imageGenerationFunction.addToRolePolicy(bedrockPolicy);
```

#### ✅ **Lambda → S3** (Configured)
```typescript
// Image generation function gets full read/write access
buckets.images.grantReadWrite(functions.imageGeneration);

// Other functions get read access for signed URLs
buckets.images.grantRead(functions.storyGeneration);
buckets.images.grantRead(functions.storyFill);
```

**Permissions Granted**:
- `s3:GetObject`
- `s3:PutObject` (image generation only)
- `s3:DeleteObject` (image generation only)
- `s3:ListBucket`
- `s3:GetBucketLocation`

### CloudFront → S3 (Configured)

#### ✅ **CloudFront → Website Bucket**
```typescript
buckets.website.addToResourcePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
  actions: ['s3:GetObject'],
  resources: [`${buckets.website.bucketArn}/*`],
  conditions: {
    StringEquals: {
      'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
    },
  },
}));
```

#### ✅ **CloudFront → Images Bucket**
```typescript
buckets.images.addToResourcePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
  actions: ['s3:GetObject'],
  resources: [`${buckets.images.bucketArn}/*`],
  conditions: {
    StringEquals: {
      'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
    },
  },
}));
```

### API Gateway → Lambda (Automatic)

#### ✅ **API Gateway → Lambda Functions** (CDK Handles Automatically)
```typescript
// CDK automatically creates invoke permissions when using LambdaIntegration
generateTemplateResource.addMethod('POST', new apigateway.LambdaIntegration(functions.storyGeneration));
fillTemplateResource.addMethod('POST', new apigateway.LambdaIntegration(functions.storyFill));
generateImageResource.addMethod('POST', new apigateway.LambdaIntegration(functions.imageGeneration));
testAwsResource.addMethod('GET', new apigateway.LambdaIntegration(functions.testAws));
```

**Auto-Generated Permissions**:
- `lambda:InvokeFunction` for each Lambda function
- Proper resource-based policies on Lambda functions

## ✅ **All Required Permissions Are Configured!**

### Summary of Service Communications:

1. **API Gateway** → **Lambda Functions** ✅
   - Auto-configured by CDK LambdaIntegration

2. **Lambda Functions** → **DynamoDB** ✅
   - Read/write permissions granted via `table.grantReadWriteData()`

3. **Lambda Functions** → **Bedrock AI** ✅
   - Model invocation permissions via custom IAM policy

4. **Lambda Functions** → **S3 Images** ✅
   - Read/write permissions via `buckets.images.grantReadWrite()`

5. **CloudFront** → **S3 Buckets** ✅
   - Origin Access Control with proper bucket policies

6. **Lambda Functions** → **CloudWatch Logs** ✅
   - Auto-configured by CDK (default Lambda execution role)

## 🔒 Security Features

### Least Privilege Access
- ✅ **Scoped Permissions**: Each service only gets necessary permissions
- ✅ **Resource-Specific**: ARNs limit access to specific resources
- ✅ **Condition-Based**: CloudFront access restricted by source ARN

### Automatic IAM Role Management
- ✅ **Lambda Execution Roles**: CDK creates dedicated roles for each function
- ✅ **Service-Linked Roles**: AWS manages roles for CloudFront, API Gateway
- ✅ **Cross-Service Policies**: Proper trust relationships established

### Audit and Monitoring
- ✅ **CloudTrail Integration**: All service calls logged
- ✅ **CloudWatch Metrics**: Service interaction metrics available
- ✅ **Resource Tags**: All resources tagged for tracking

## 🧪 Testing Service Permissions

### Test Lambda → DynamoDB
```bash
# Deploy and test via API
curl -X POST https://your-api-gateway-url/api/test-aws
```

### Test Lambda → Bedrock
```bash
# Test story generation
curl -X POST https://your-api-gateway-url/api/story/generate-template \
  -H "Content-Type: application/json" \
  -d '{"theme": "adventure", "playerCount": 4}'
```

### Test Lambda → S3
```bash
# Test image generation (creates S3 objects)
curl -X POST https://your-api-gateway-url/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A magical forest", "style": "photographic"}'
```

### Test CloudFront → S3
```bash
# Access static assets via CloudFront
curl https://your-cloudfront-domain.cloudfront.net/
```

## 🚨 Troubleshooting

### Common Permission Issues

#### "Access Denied" from Lambda to DynamoDB
- ✅ Check table name matches environment variable
- ✅ Verify Lambda function has correct execution role
- ✅ Ensure DynamoDB table exists in same region

#### "Access Denied" from Lambda to Bedrock
- ✅ Verify Bedrock models are enabled in your account
- ✅ Check region supports the Nova models
- ✅ Ensure Lambda execution role has Bedrock permissions

#### "Access Denied" from Lambda to S3
- ✅ Check S3 bucket name in environment variables
- ✅ Verify bucket exists and is in same region
- ✅ Ensure Lambda role has S3 permissions

#### CloudFront "Access Denied" to S3
- ✅ Verify Origin Access Control is configured
- ✅ Check S3 bucket policy allows CloudFront
- ✅ Ensure distribution ID matches in bucket policy

### Debugging Commands

```bash
# Check Lambda function configuration
aws lambda get-function --function-name MadLibsServerless-development-StoryGeneration

# Check Lambda execution role
aws iam get-role --role-name MadLibsServerless-development-StoryGenerationRole

# Check DynamoDB table
aws dynamodb describe-table --table-name MadLibsServerless-development-GameData

# Check S3 bucket policy
aws s3api get-bucket-policy --bucket your-bucket-name
```

## 📋 Permission Checklist

When deploying, verify these permissions are working:

- [ ] **API Gateway** can invoke Lambda functions
- [ ] **Lambda functions** can read/write to DynamoDB
- [ ] **Lambda functions** can invoke Bedrock models
- [ ] **Lambda functions** can access S3 buckets
- [ ] **CloudFront** can access S3 static assets
- [ ] **CloudFront** can access S3 images
- [ ] **Lambda functions** can write to CloudWatch Logs

All of these should work automatically with our CDK configuration! 🎉

## 🔧 Manual Permission Fixes (If Needed)

If you encounter permission issues after deployment, you can manually add permissions:

### Add Bedrock Permission to Lambda
```bash
aws iam attach-role-policy \
  --role-name MadLibsServerless-development-StoryGenerationRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
```

### Add S3 Permission to Lambda
```bash
aws iam attach-role-policy \
  --role-name MadLibsServerless-development-ImageGenerationRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

However, our CDK configuration should handle all of this automatically! 🚀