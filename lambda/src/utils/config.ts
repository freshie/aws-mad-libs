import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

// Cache for configuration values to avoid repeated API calls
const configCache = new Map<string, string>();

// SSM client for reading configuration
const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });

/**
 * Get CloudFront domain from Parameter Store
 * Uses caching to avoid repeated API calls within the same Lambda execution
 */
export async function getCloudFrontDomain(): Promise<string> {
  const cacheKey = 'cloudfront-domain';
  
  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }

  try {
    // Determine the parameter name based on the stack name
    const stackName = process.env.STACK_NAME || 'madlibsserverless-development';
    const parameterName = `/madlibs/${stackName.toLowerCase()}/cloudfront-domain`;

    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: false, // Not encrypted for this use case
    });

    const response = await ssmClient.send(command);
    
    if (!response.Parameter?.Value) {
      throw new Error(`CloudFront domain parameter not found: ${parameterName}`);
    }

    const domain = response.Parameter.Value;
    
    // Cache the value for subsequent calls in the same execution
    configCache.set(cacheKey, domain);
    
    return domain;
  } catch (error) {
    console.error('Failed to get CloudFront domain from Parameter Store:', error);
    throw new Error('CloudFront domain configuration not available');
  }
}

/**
 * Get CloudFront distribution ID from Parameter Store
 */
export async function getCloudFrontDistributionId(): Promise<string> {
  const cacheKey = 'cloudfront-distribution-id';
  
  // Check cache first
  if (configCache.has(cacheKey)) {
    return configCache.get(cacheKey)!;
  }

  try {
    // Determine the parameter name based on the stack name
    const stackName = process.env.STACK_NAME || 'madlibsserverless-development';
    const parameterName = `/madlibs/${stackName.toLowerCase()}/cloudfront-distribution-id`;

    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: false,
    });

    const response = await ssmClient.send(command);
    
    if (!response.Parameter?.Value) {
      throw new Error(`CloudFront distribution ID parameter not found: ${parameterName}`);
    }

    const distributionId = response.Parameter.Value;
    
    // Cache the value
    configCache.set(cacheKey, distributionId);
    
    return distributionId;
  } catch (error) {
    console.error('Failed to get CloudFront distribution ID from Parameter Store:', error);
    throw new Error('CloudFront distribution ID configuration not available');
  }
}

/**
 * Clear the configuration cache (useful for testing)
 */
export function clearConfigCache(): void {
  configCache.clear();
}