# PowerShell Command Execution Best Practices for Kiro

## Overview

This document outlines best practices for executing PowerShell commands in Kiro to avoid common issues that can interrupt the AI workflow, particularly with paginated output that requires manual intervention.

## The Pagination Problem

### Issue Description
When executing commands that produce long output (like CDK deployments, AWS CLI responses, or verbose logs), PowerShell may activate the "more" pager, which:
- Stops execution and waits for user input (spacebar, Enter, or 'q')
- Causes Kiro to hang indefinitely waiting for the command to complete
- Requires manual intervention to continue the workflow

### Common Commands That Trigger This:
- `npx cdk deploy`
- `aws cloudformation describe-stacks`
- `npm test -- --verbose`
- `git log`
- Long file listings or search results

## Solutions

### Method 1: Pipe to Out-String (Recommended)
```powershell
# Instead of:
npx cdk deploy

# Use:
npx cdk deploy | Out-String
```

### Method 2: Use Tool-Specific No-Pager Options
```powershell
# AWS CLI
aws cloudformation describe-stacks --no-cli-pager

# Git
git log --no-pager

# CDK (if available)
npx cdk deploy --no-pager
```

### Method 3: Set Environment Variables
```powershell
# Disable AWS CLI pager globally for the session
$env:AWS_PAGER = ""

# Then run commands normally
aws cloudformation describe-stacks
```

### Method 4: Use PowerShell Formatting
```powershell
# For commands that might paginate
command | Format-Table -AutoSize | Out-String

# Or for simple output
command | Out-Host -Paging:$false
```

## Command-Specific Examples

### CDK Deployments
```powershell
# ❌ Problematic
npx cdk deploy --require-approval never

# ✅ Better
npx cdk deploy --require-approval never | Out-String
```

### AWS CLI Commands
```powershell
# ❌ Problematic
aws s3 ls s3://my-bucket --recursive

# ✅ Better
aws s3 ls s3://my-bucket --recursive --no-cli-pager

# ✅ Alternative
aws s3 ls s3://my-bucket --recursive | Out-String
```

### NPM/Node Commands
```powershell
# ❌ Problematic
npm test -- --verbose

# ✅ Better
npm test -- --verbose | Out-String
```

### File Operations
```powershell
# ❌ Problematic (for large directories)
Get-ChildItem -Recurse

# ✅ Better
Get-ChildItem -Recurse | Out-String
```

## Implementation Guidelines for Kiro

### When to Apply These Practices

1. **Always use for deployment commands**: CDK, CloudFormation, Docker builds
2. **Always use for AWS CLI commands**: Unless you know the output will be short
3. **Use for test commands**: Especially with verbose output
4. **Use for file listings**: When recursively listing directories
5. **Use for log viewing**: Any command that might show many lines

### Detection Patterns

Apply these practices when commands:
- Are known to produce verbose output
- Involve cloud deployments or infrastructure
- Include `--verbose`, `--debug`, or similar flags
- List or search through large datasets
- Display logs or historical information

### Code Examples in Kiro Context

```powershell
# Deployment workflow
npm run build:lambda | Out-String
npx cdk deploy --require-approval never | Out-String
aws s3 sync out/ s3://bucket-name --delete --no-cli-pager

# Testing workflow
npm test | Out-String
npm run test:coverage | Out-String

# AWS operations
aws sts get-caller-identity --no-cli-pager
aws ssm get-parameter --name "/path/to/param" --no-cli-pager
```

## Troubleshooting

### If a Command Still Hangs
1. **Check for interactive prompts**: Some commands may be waiting for input beyond pagination
2. **Use timeout**: Consider adding timeout mechanisms for long-running commands
3. **Break into smaller commands**: Split complex operations into smaller, more manageable pieces

### Alternative Approaches
```powershell
# Use Start-Process for completely detached execution
Start-Process -FilePath "npx" -ArgumentList "cdk", "deploy" -Wait -NoNewWindow

# Use Invoke-Expression with output capture
$output = Invoke-Expression "command" 2>&1
Write-Output $output
```

## Best Practices Summary

### ✅ Do This:
- Always pipe verbose commands to `| Out-String`
- Use `--no-cli-pager` for AWS CLI commands
- Set `$env:AWS_PAGER = ""` at the start of AWS-heavy workflows
- Test commands locally first to identify pagination issues

### ❌ Avoid This:
- Running deployment commands without pagination handling
- Assuming short output won't trigger pagination
- Using interactive commands without proper input handling
- Ignoring tool-specific no-pager options

## Environment-Specific Notes

### Windows PowerShell vs PowerShell Core
- Both versions can experience pagination issues
- `Out-String` works consistently across versions
- PowerShell Core may have different default paging behavior

### Integration with Other Tools
- **Git**: Use `git config --global core.pager ""` to disable globally
- **Docker**: Most commands don't paginate, but logs might
- **Kubernetes**: Use `--no-pager` flag where available

---

**Last Updated**: August 16, 2025  
**Version**: 1.0  
**Next Review**: September 16, 2025

## Related Documentation
- [Testing Architecture](.kiro/docs/testing-architecture.md)
- [TDD Workflow](.kiro/steering/tdd-workflow.md)