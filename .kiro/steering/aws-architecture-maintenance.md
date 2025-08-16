---
inclusion: always
---

# AWS Architecture Diagram Maintenance Guidelines

## Mandatory Architecture Documentation

**ALWAYS update the architecture diagram when adding new AWS services to the infrastructure.**

## When to Update the Diagram

### ✅ Update Required When:
1. **Adding new AWS services** to CDK stack
2. **Modifying service connections** or data flow
3. **Adding new IAM policies** or permissions
4. **Changing service configurations** that affect architecture
5. **Adding new Lambda functions** or API endpoints
6. **Modifying S3 bucket policies** or CloudFront behaviors

### 📝 What to Update:
1. **Add new service icons** using official AWS shapes
2. **Update service connections** with arrows showing data flow
3. **Update legend** to include new services
4. **Update data flow description** if changed
5. **Verify service positioning** follows AWS architecture best practices

## Architecture Diagram Location

**File**: `docs/aws-mad-libs-architecture.drawio`

## Update Process

### Step 1: Identify New Services
Before making CDK changes, identify what AWS services will be added:
```bash
# Search for new AWS service imports in CDK
grep -r "aws-cdk-lib/aws-" cdk/ | grep -v "node_modules"
```

### Step 2: Update Diagram
1. **Open** `docs/aws-mad-libs-architecture.drawio` in draw.io
2. **Add service icon** from AWS shape library
3. **Position appropriately** within AWS region or globally
4. **Add connections** showing data flow
5. **Update labels** with service description
6. **Update legend** to include new service

### Step 3: Verify Completeness
Ensure all services in CDK are represented:
- CloudFront (CDN)
- IAM (Roles & Policies)
- S3 (Static Hosting & Storage)
- API Gateway (REST API)
- Lambda (Serverless Compute)
- DynamoDB (NoSQL Database)
- Bedrock (AI Models)
- CloudWatch (Monitoring)
- Parameter Store (Configuration)
- **[Add new services here]**

## Service Categories

### Global Services
- CloudFront
- IAM
- Route 53 (if added)

### Regional Services
- S3
- API Gateway
- Lambda
- DynamoDB
- Bedrock
- CloudWatch
- Parameter Store
- VPC (if added)
- RDS (if added)
- ElastiCache (if added)

## Architecture Best Practices

### Visual Organization
- **Group related services** together
- **Use consistent spacing** between components
- **Follow AWS Well-Architected** visual patterns
- **Show clear data flow** with labeled arrows

### Service Connections
- **API calls**: Solid arrows
- **Data storage**: Dashed arrows
- **Configuration**: Dotted arrows
- **Monitoring**: Different color arrows

### Labels and Descriptions
- **Service name** and primary function
- **Key configuration** details
- **Data types** handled

## Common AWS Services to Watch For

### Compute
- Lambda Functions
- ECS/Fargate
- EC2 (if added)

### Storage
- S3 Buckets
- EFS (if added)
- EBS (if added)

### Database
- DynamoDB
- RDS (if added)
- ElastiCache (if added)

### Networking
- API Gateway
- CloudFront
- VPC (if added)
- Load Balancers (if added)

### Security
- IAM
- Cognito (if added)
- WAF (if added)
- Secrets Manager (if added)

### Management
- CloudWatch
- Parameter Store
- CloudFormation (implicit via CDK)

### AI/ML
- Bedrock
- SageMaker (if added)
- Comprehend (if added)

## Automation Reminders

### CDK Deployment Checklist
Before running `cdk deploy`:
- [ ] **Architecture diagram updated** with new services
- [ ] **Service connections verified** in diagram
- [ ] **Legend updated** with new services
- [ ] **Data flow description updated** if changed

### Code Review Checklist
When reviewing CDK changes:
- [ ] **New AWS imports** identified
- [ ] **Architecture diagram** includes all services
- [ ] **Service relationships** clearly shown
- [ ] **Documentation** matches implementation

## Example Service Additions

### Adding Cognito Authentication
```typescript
// CDK Code
import * as cognito from 'aws-cdk-lib/aws-cognito';

// Diagram Update Required:
// 1. Add Cognito User Pool icon
// 2. Connect to API Gateway
// 3. Update legend
// 4. Update data flow description
```

### Adding RDS Database
```typescript
// CDK Code
import * as rds from 'aws-cdk-lib/aws-rds';

// Diagram Update Required:
// 1. Add RDS icon in regional services
// 2. Connect to Lambda functions
// 3. Update legend
// 4. Show VPC if required
```

## Quality Gates

### Before Committing Code
- [ ] **All new AWS services** represented in diagram
- [ ] **Service connections** accurately shown
- [ ] **Legend updated** with new services
- [ ] **Diagram follows** AWS architecture patterns

### During Code Review
- [ ] **Diagram matches** CDK implementation
- [ ] **No missing services** in visual representation
- [ ] **Data flow** accurately represented
- [ ] **Service descriptions** are clear

## Remember: Architecture Diagrams are Living Documents

**The diagram should always reflect the current state of the infrastructure. Outdated diagrams are worse than no diagrams.**

## Tools and Resources

### Draw.io AWS Shapes
- Use official AWS architecture icons
- Follow AWS color schemes
- Maintain consistent sizing

### AWS Architecture Center
- Reference official AWS architecture patterns
- Follow Well-Architected Framework principles
- Use standard AWS terminology

**Keep the architecture diagram current with every infrastructure change!**