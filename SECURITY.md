# Security Guidelines

## 🔐 Credential Management

### ❌ Never Commit These Files:
- `.env.local` - Contains local development credentials
- `.env.production` - Contains production environment variables  
- `cdk.out/` - Contains AWS account IDs and deployment artifacts
- `cdk-outputs-*.json` - Contains deployed resource ARNs and IDs

### ✅ Safe to Commit:
- `.env.example` - Template with placeholder values
- Documentation with example credentials (clearly marked as examples)
- Code that references environment variables (not actual values)

## 🛡️ AWS Security Best Practices

### Credential Storage:
- Use AWS profiles for local development
- Use IAM roles for Lambda functions (no hardcoded credentials)
- Store sensitive values in environment variables
- Use AWS Secrets Manager for production secrets

### Account Information:
- AWS Account IDs are considered sensitive
- Resource ARNs contain account information
- CDK outputs contain deployment-specific data

## 🔍 Pre-Push Security Checklist:

Before pushing to GitHub, verify:
- [ ] No AWS credentials in code or git history
- [ ] No AWS account IDs in committed files
- [ ] `.env*` files are in `.gitignore`
- [ ] `cdk.out/` directory is in `.gitignore`
- [ ] CDK output files are not tracked

## 🚨 If Credentials Are Accidentally Committed:

1. **Immediately rotate** the exposed credentials
2. **Remove from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** the cleaned history
4. **Update all team members** to re-clone the repository

## 📞 Security Contact

If you discover security issues, please report them responsibly.