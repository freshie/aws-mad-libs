# ⚠️ LOCAL DEVELOPMENT IS DISABLED

## This Application Runs on AWS Only

This AI Mad Libs application is designed to run exclusively on AWS infrastructure and **cannot be run locally**.

### Why Local Development is Disabled:

1. **Lambda Functions**: The core story generation logic runs on AWS Lambda
2. **S3 Storage**: Images and assets are stored in S3 buckets
3. **CloudFront CDN**: Content delivery requires CloudFront distribution
4. **Parameter Store**: Configuration is stored in AWS Systems Manager
5. **Bedrock AI**: Story and image generation uses AWS Bedrock services

### To Work on This Project:

1. **Deploy to AWS**: Use the deployment script
   ```powershell
   .\scripts\deploy-to-aws.ps1
   ```

2. **Make Changes**: Edit code locally but test on AWS
3. **Redeploy**: Run deployment script after changes
4. **Test**: Use the CloudFront URL to test functionality

### Development Workflow:

```
Edit Code → Run Tests → Deploy to AWS → Test on CloudFront URL
```

### Quick Deployment Commands:

```powershell
# Full deployment
.\scripts\deploy-to-aws.ps1

# Skip tests and builds (faster for small changes)
.\scripts\deploy-to-aws.ps1 -SkipTests -SkipBuild

# Deploy with specific AWS profile
.\scripts\deploy-to-aws.ps1 -Profile myprofile
```

### Getting Started:

1. Read: `.kiro/docs/aws-deployment-guide.md`
2. Configure AWS CLI with your credentials
3. Run: `.\scripts\deploy-to-aws.ps1`
4. Access your app at the provided CloudFront URL

---

**Remember: Any attempt to run `npm start` or similar local commands will not work properly because the backend services are on AWS.**