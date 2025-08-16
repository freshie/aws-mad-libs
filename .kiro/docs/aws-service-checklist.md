# AWS Service Addition Checklist

## 🚨 MANDATORY: Update Architecture Diagram

**Every time you add a new AWS service to the CDK stack, you MUST update the architecture diagram.**

## Quick Checklist

### Before Adding AWS Service
- [ ] **Plan service placement** in architecture diagram
- [ ] **Identify service connections** and data flow
- [ ] **Check if service is regional or global**

### While Adding AWS Service
- [ ] **Add CDK import** for new service
- [ ] **Configure service** in CDK stack
- [ ] **Add IAM permissions** if needed
- [ ] **Add environment variables** if needed

### After Adding AWS Service
- [ ] **Open** `docs/aws-mad-libs-architecture.drawio`
- [ ] **Add service icon** from AWS shapes library
- [ ] **Position service** appropriately (regional/global)
- [ ] **Add connections** showing data flow
- [ ] **Update service label** with description
- [ ] **Update legend** to include new service
- [ ] **Update data flow** description if changed
- [ ] **Save and commit** diagram changes

## Common AWS Services and Their Icons

### Compute
- **Lambda**: `mxgraph.aws4.lambda`
- **ECS**: `mxgraph.aws4.ecs`
- **EC2**: `mxgraph.aws4.ec2`

### Storage
- **S3**: `mxgraph.aws4.s3`
- **EFS**: `mxgraph.aws4.efs`

### Database
- **DynamoDB**: `mxgraph.aws4.dynamodb`
- **RDS**: `mxgraph.aws4.rds`

### Networking
- **API Gateway**: `mxgraph.aws4.api_gateway`
- **CloudFront**: `mxgraph.aws4.cloudfront`
- **VPC**: `mxgraph.aws4.vpc`

### Security
- **IAM**: `mxgraph.aws4.identity_and_access_management`
- **Cognito**: `mxgraph.aws4.cognito`

### Management
- **CloudWatch**: `mxgraph.aws4.cloudwatch`
- **Parameter Store**: `mxgraph.aws4.systems_manager`

### AI/ML
- **Bedrock**: `mxgraph.aws4.bedrock`

## Quick Commands

### Check for new AWS services in CDK
```bash
grep -r "aws-cdk-lib/aws-" cdk/ | grep "import" | sort | uniq
```

### Verify all services are in diagram
```bash
# Compare CDK imports with diagram services
# Manual verification required
```

## Remember
**An outdated architecture diagram is worse than no diagram. Keep it current!**