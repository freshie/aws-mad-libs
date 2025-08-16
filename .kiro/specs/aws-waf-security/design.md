# AWS WAF Security Enhancement - Design Document

## Overview

This design enhances the existing AWS WAF configuration to provide comprehensive protection against DDoS attacks and malicious bots while maintaining optimal performance for legitimate users of the Mad Libs game application.

## Architecture

### Current WAF Setup
- AWS WAF v2 Web ACL associated with CloudFront distribution
- Basic managed rules: Core Rule Set, Known Bad Inputs, IP Reputation
- Rate limiting: 100 requests per 5 minutes (needs updating)

### Enhanced WAF Architecture
```
Internet Traffic → CloudFront → WAF Web ACL → Origin (S3/API Gateway)
                                    ↓
                              CloudWatch Metrics & Logs
```

## Components and Interfaces

### 1. WAF Web ACL Configuration

#### Managed Rule Groups
- **AWSManagedRulesCommonRuleSet**: OWASP Top 10 protection
- **AWSManagedRulesKnownBadInputsRuleSet**: Known malicious patterns
- **AWSManagedRulesAmazonIpReputationList**: IP reputation blocking
- **AWSManagedRulesBotControlRuleSet**: Bot detection and blocking

#### Custom Rules
- **Enhanced Rate Limiting**: 1,000 requests per minute per IP
- **API Protection**: Additional rate limiting for `/api/*` paths
- **Static Asset Optimization**: Separate handling for cached content

### 2. CloudWatch Integration

#### Metrics
- Request count by rule
- Blocked request count
- Rate limit violations
- Bot detection events

#### Alarms
- High blocked request rate (potential attack)
- Rate limit threshold breaches
- WAF rule failures

### 3. Logging Configuration

#### WAF Logs
- All blocked requests logged to CloudWatch Logs
- Sampled allowed requests for analysis
- Request metadata for debugging

## Data Models

### WAF Rule Priority Structure
```
Priority 1: Bot Control (highest priority)
Priority 2: Core Rule Set (OWASP protection)
Priority 3: Known Bad Inputs
Priority 4: IP Reputation List
Priority 5: Enhanced Rate Limiting (1,000/minute)
Priority 6: API-specific Rate Limiting (if needed)
```

### Rate Limiting Configuration
```typescript
interface RateLimitConfig {
  limit: 1000;           // requests per minute
  aggregateKeyType: 'IP';
  evaluationWindowSec: 60;
  action: 'BLOCK';
}
```

### Bot Control Configuration
```typescript
interface BotControlConfig {
  inspectionLevel: 'COMMON';  // Balance between protection and cost
  managedRuleGroupConfigs: {
    // Allow legitimate crawlers
    'CategorySearchEngine': 'ALLOW';
    // Block malicious bots
    'CategoryHttpLibrary': 'BLOCK';
    'CategoryScrapingFramework': 'BLOCK';
  };
}
```

## Error Handling

### Rate Limiting Responses
- HTTP 429 (Too Many Requests) for rate limit violations
- Custom error page with retry guidance
- Exponential backoff recommendations

### Bot Detection Responses
- HTTP 403 (Forbidden) for detected bots
- Challenge responses for suspicious traffic
- Logging of bot detection events

### WAF Rule Failures
- Fallback to default allow action
- CloudWatch alarms for rule failures
- Automatic rule health monitoring

## Testing Strategy

### Unit Tests
- CDK construct validation
- WAF rule configuration verification
- CloudWatch alarm threshold validation

### Integration Tests
- WAF deployment verification
- CloudFront association testing
- Metric collection validation

### Load Testing
- Simulate normal user traffic patterns
- Test rate limiting thresholds
- Verify bot detection accuracy

### Security Testing
- Simulated DDoS attack scenarios
- Bot traffic simulation
- OWASP Top 10 attack testing

## Performance Considerations

### Request Latency
- WAF adds ~1-2ms latency per request
- CloudFront caching reduces origin requests
- Bot Control adds minimal overhead

### Cost Optimization
- Use COMMON inspection level for Bot Control
- Sample logging to reduce costs
- Optimize rule evaluation order

### Scalability
- WAF automatically scales with CloudFront
- No capacity planning required
- Global edge location deployment

## Monitoring and Alerting

### Key Metrics to Monitor
- `AWS/WAFV2/BlockedRequests`: Blocked request count
- `AWS/WAFV2/AllowedRequests`: Allowed request count
- `AWS/WAFV2/SampledRequests`: Sample of requests for analysis

### Alert Thresholds
- Blocked requests > 100/minute: Potential attack
- Rate limit violations > 50/minute: Possible abuse
- WAF rule errors > 5/minute: Configuration issue

### Dashboard Components
- Real-time request metrics
- Geographic distribution of blocked requests
- Top blocked IP addresses
- Bot detection statistics

## Security Considerations

### Rule Bypass Prevention
- Multiple layers of protection
- Regular rule updates from AWS
- Custom rule validation

### False Positive Mitigation
- Whitelist for known good IPs (if needed)
- Gradual rule deployment
- Monitoring for legitimate traffic blocks

### Compliance
- Logging for audit requirements
- Data retention policies
- Privacy considerations for IP logging

## Deployment Strategy

### Phase 1: Enhanced Rate Limiting
- Update existing rate limit from 100/5min to 1,000/min
- Deploy and monitor for 24 hours

### Phase 2: Bot Control
- Add Bot Control managed rule group
- Monitor bot detection accuracy
- Adjust configuration based on results

### Phase 3: Monitoring Enhancement
- Add CloudWatch alarms
- Configure logging
- Create monitoring dashboard

### Rollback Plan
- Keep previous WAF configuration as backup
- Quick rollback capability via CDK
- Monitoring for performance degradation

## Architecture Diagram Updates

### Required Updates to aws-mad-libs-architecture.drawio
- Add AWS WAF icon positioned between Internet and CloudFront
- Show WAF protecting CloudFront distribution
- Update legend to include WAF service
- Add data flow arrows showing request filtering
- Include CloudWatch integration for WAF metrics