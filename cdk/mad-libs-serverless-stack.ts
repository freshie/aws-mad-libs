import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export class MadLibsServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create all AWS resources
    
    // DynamoDB Table (Task 17)
    const gameTable = this.createDynamoDBTable();
    
    // Lambda Functions (Task 18)
    const lambdaFunctions = this.createLambdaFunctions(gameTable);
    
    // S3 Buckets (Task 20)
    const buckets = this.createS3Buckets();
    
    // API Gateway (Task 21)
    const api = this.createApiGateway(lambdaFunctions);
    
    // CloudFront Distribution (Task 20)
    const distribution = this.createCloudFrontDistribution(buckets, api);

    // Store CloudFront domain in Parameter Store for Lambda functions to access
    this.storeCloudFrontDomain(distribution);

    // Update Lambda functions with S3 bucket permissions
    this.updateLambdaS3Permissions(lambdaFunctions, buckets);
    
    // Output important values
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'Name of the CDK stack',
    });
    
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where resources are deployed',
    });
  }

  // Placeholder methods for future tasks
  
  private createDynamoDBTable(): dynamodb.Table {
    // Single table design for optimal performance and cost
    const table = new dynamodb.Table(this, 'GameDataTable', {
      // Let CDK generate the table name to avoid conflicts
      
      // Partition Key and Sort Key for single-table design
      partitionKey: {
        name: 'PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'SK',
        type: dynamodb.AttributeType.STRING,
      },
      
      // Pay-per-request billing for cost optimization
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      
      // TTL for automatic cleanup of expired game sessions
      timeToLiveAttribute: 'TTL',
      
      // Point-in-time recovery for data protection
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      
      // Deletion protection for production safety
      deletionProtection: false, // Set to true in production
      
      // Encryption at rest
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      
      // Tags are applied at the stack level or using cdk.Tags.of()
    });

    // Apply tags to the table
    cdk.Tags.of(table).add('Project', 'MadLibsGame');
    cdk.Tags.of(table).add('Environment', process.env.NODE_ENV || 'development');
    cdk.Tags.of(table).add('Component', 'Database');

    // Global Secondary Index for alternative access patterns
    table.addGlobalSecondaryIndex({
      indexName: 'GSI1',
      partitionKey: {
        name: 'GSI1PK',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'GSI1SK',
        type: dynamodb.AttributeType.STRING,
      },
      // Inherit billing mode from table
    });

    // Add a second GSI for room code lookups
    table.addGlobalSecondaryIndex({
      indexName: 'RoomCodeIndex',
      partitionKey: {
        name: 'RoomCode',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'CreatedAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Output table information
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'Name of the DynamoDB table for game data',
      exportName: `${this.stackName}-TableName`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: table.tableArn,
      description: 'ARN of the DynamoDB table',
      exportName: `${this.stackName}-TableArn`,
    });

    return table;
  }
  
  private createLambdaFunctions(table: dynamodb.Table): { [key: string]: lambda.Function } {
    // Common environment variables for all Lambda functions
    const commonEnvironment = {
      TABLE_NAME: table.tableName,
      NODE_ENV: process.env.NODE_ENV || 'production',
      DEBUG_ERRORS: 'true', // Enable detailed error responses
      STACK_NAME: this.stackName, // For Parameter Store access
    };

    // Story Generation Lambda
    const storyGenerationFunction = new lambda.Function(this, 'StoryGenerationFunction', {
      functionName: `${this.stackName}-StoryGeneration`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'story-generation.handler',
      code: lambda.Code.fromAsset('lambda/dist'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: commonEnvironment,
      description: 'Generates story templates using AWS Bedrock',
    });

    // Story Fill Lambda
    const storyFillFunction = new lambda.Function(this, 'StoryFillFunction', {
      functionName: `${this.stackName}-StoryFill`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'story-fill.handler',
      code: lambda.Code.fromAsset('lambda/dist'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: commonEnvironment,
      description: 'Fills story templates with player words',
    });

    // Image Generation Lambda
    const imageGenerationFunction = new lambda.Function(this, 'ImageGenerationFunction', {
      functionName: `${this.stackName}-ImageGeneration`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'image-generation.handler',
      code: lambda.Code.fromAsset('lambda/dist'),
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024,
      environment: commonEnvironment,
      description: 'Generates images using AWS Bedrock Nova Canvas - Parsed API key',
    });

    // Video Generation Lambda
    const videoGenerationFunction = new lambda.Function(this, 'VideoGenerationFunction', {
      functionName: `${this.stackName}-VideoGeneration`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'video-generation.handler',
      code: lambda.Code.fromAsset('lambda/dist'),
      timeout: cdk.Duration.seconds(300), // 5 minutes for video generation
      memorySize: 2048, // More memory for video processing
      environment: commonEnvironment,
      description: 'Generates videos using AWS Bedrock Nova Reel from story images and text - Fixed',
    });

    // Test AWS Lambda
    const testAwsFunction = new lambda.Function(this, 'TestAwsFunction', {
      functionName: `${this.stackName}-TestAws`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'test-aws.handler',
      code: lambda.Code.fromAsset('lambda/dist'),
      timeout: cdk.Duration.seconds(15),
      memorySize: 256,
      environment: commonEnvironment,
      description: 'Tests AWS service connectivity',
    });

    // Grant DynamoDB permissions to Lambda functions
    table.grantReadWriteData(storyGenerationFunction);
    table.grantReadWriteData(storyFillFunction);
    table.grantReadData(imageGenerationFunction);
    table.grantReadData(videoGenerationFunction);
    table.grantReadData(testAwsFunction);

    // Grant Bedrock permissions
    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream',
        'bedrock:ListFoundationModels',
        'bedrock:GetFoundationModel',
      ],
      resources: [
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0',
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-canvas-v1:0',
        'arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-image-generator-v1',
        'arn:aws:bedrock:us-east-1::foundation-model/stability.stable-diffusion-xl-v1',
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0',
        // Also allow wildcard for any bedrock model as fallback
        'arn:aws:bedrock:us-east-1::foundation-model/*',
      ],
    });

    storyGenerationFunction.addToRolePolicy(bedrockPolicy);
    storyFillFunction.addToRolePolicy(bedrockPolicy);
    imageGenerationFunction.addToRolePolicy(bedrockPolicy);
    videoGenerationFunction.addToRolePolicy(bedrockPolicy);

    // Grant Parameter Store read permissions for CloudFront domain
    const parameterStorePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
      ],
      resources: [
        `arn:aws:ssm:${this.region}:${this.account}:parameter/madlibs/${this.stackName.toLowerCase()}/*`,
      ],
    });

    imageGenerationFunction.addToRolePolicy(parameterStorePolicy);
    videoGenerationFunction.addToRolePolicy(parameterStorePolicy);
    storyGenerationFunction.addToRolePolicy(parameterStorePolicy);
    storyFillFunction.addToRolePolicy(parameterStorePolicy);

    // S3 permissions will be granted later when buckets are created

    // Apply tags to all Lambda functions
    const functions = [storyGenerationFunction, storyFillFunction, imageGenerationFunction, videoGenerationFunction, testAwsFunction];
    functions.forEach(func => {
      cdk.Tags.of(func).add('Project', 'MadLibsGame');
      cdk.Tags.of(func).add('Environment', process.env.NODE_ENV || 'development');
      cdk.Tags.of(func).add('Component', 'Lambda');
    });

    // Output Lambda function ARNs
    new cdk.CfnOutput(this, 'StoryGenerationFunctionArn', {
      value: storyGenerationFunction.functionArn,
      description: 'ARN of the Story Generation Lambda function',
      exportName: `${this.stackName}-StoryGenerationFunctionArn`,
    });

    new cdk.CfnOutput(this, 'ImageGenerationFunctionArn', {
      value: imageGenerationFunction.functionArn,
      description: 'ARN of the Image Generation Lambda function',
      exportName: `${this.stackName}-ImageGenerationFunctionArn`,
    });

    new cdk.CfnOutput(this, 'VideoGenerationFunctionArn', {
      value: videoGenerationFunction.functionArn,
      description: 'ARN of the Video Generation Lambda function',
      exportName: `${this.stackName}-VideoGenerationFunctionArn`,
    });

    return {
      storyGeneration: storyGenerationFunction,
      storyFill: storyFillFunction,
      imageGeneration: imageGenerationFunction,
      videoGeneration: videoGenerationFunction,
      testAws: testAwsFunction,
    };
  }
  
  private createS3Buckets(): { website: s3.Bucket; images: s3.Bucket } {
    // S3 bucket for static website hosting
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      bucketName: `${this.stackName.toLowerCase()}-website-${this.account}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error.html',
      publicReadAccess: false, // Will use CloudFront OAC instead
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - change to RETAIN in production
      autoDeleteObjects: true, // For development - remove in production
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // S3 bucket for AI-generated images
    const imagesBucket = new s3.Bucket(this, 'ImagesBucket', {
      bucketName: `${this.stackName.toLowerCase()}-images-${this.account}`,
      publicReadAccess: false, // Will use signed URLs
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
      autoDeleteObjects: true, // For development
      versioned: false, // Images don't need versioning
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldImages',
          enabled: true,
          expiration: cdk.Duration.days(1), // Auto-delete images after 1 day
        },
      ],
    });

    // Apply tags to buckets
    cdk.Tags.of(websiteBucket).add('Project', 'MadLibsGame');
    cdk.Tags.of(websiteBucket).add('Environment', process.env.NODE_ENV || 'development');
    cdk.Tags.of(websiteBucket).add('Component', 'StaticHosting');

    cdk.Tags.of(imagesBucket).add('Project', 'MadLibsGame');
    cdk.Tags.of(imagesBucket).add('Environment', process.env.NODE_ENV || 'development');
    cdk.Tags.of(imagesBucket).add('Component', 'ImageStorage');

    // Output bucket information
    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: websiteBucket.bucketName,
      description: 'Name of the S3 bucket for static website hosting',
      exportName: `${this.stackName}-WebsiteBucketName`,
    });

    new cdk.CfnOutput(this, 'ImagesBucketName', {
      value: imagesBucket.bucketName,
      description: 'Name of the S3 bucket for AI-generated images',
      exportName: `${this.stackName}-ImagesBucketName`,
    });

    return {
      website: websiteBucket,
      images: imagesBucket,
    };
  }
  
  private createApiGateway(functions: { [key: string]: lambda.Function }): apigateway.RestApi {
    // Create the main API Gateway
    const api = new apigateway.RestApi(this, 'MadLibsApi', {
      restApiName: `${this.stackName}-API`,
      description: 'Mad Libs Game API Gateway',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    // Create /api resource
    const apiResource = api.root.addResource('api');

    // Create /api/story resource and methods
    const storyResource = apiResource.addResource('story');
    
    // /api/story/generate-template
    const generateTemplateResource = storyResource.addResource('generate-template');
    generateTemplateResource.addMethod('POST', new apigateway.LambdaIntegration(functions.storyGeneration, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    }));

    // /api/story/fill-template
    const fillTemplateResource = storyResource.addResource('fill-template');
    fillTemplateResource.addMethod('POST', new apigateway.LambdaIntegration(functions.storyFill, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    }));

    // Create /api/image resource and methods
    const imageResource = apiResource.addResource('image');
    
    // /api/image/generate
    const generateImageResource = imageResource.addResource('generate');
    generateImageResource.addMethod('POST', new apigateway.LambdaIntegration(functions.imageGeneration, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    }));

    // Create /api/video resource and methods
    const videoResource = apiResource.addResource('video');
    
    // /api/video/generate
    const generateVideoResource = videoResource.addResource('generate');
    generateVideoResource.addMethod('POST', new apigateway.LambdaIntegration(functions.videoGeneration, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    }));

    // Create /api/test-aws resource and methods
    const testAwsResource = apiResource.addResource('test-aws');
    testAwsResource.addMethod('GET', new apigateway.LambdaIntegration(functions.testAws, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    }));

    // Apply tags to API Gateway
    cdk.Tags.of(api).add('Project', 'MadLibsGame');
    cdk.Tags.of(api).add('Environment', process.env.NODE_ENV || 'development');
    cdk.Tags.of(api).add('Component', 'APIGateway');

    // Output API Gateway information
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'URL of the API Gateway',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: api.restApiId,
      description: 'ID of the API Gateway',
      exportName: `${this.stackName}-ApiGatewayId`,
    });

    return api;
  }
  
  private createCloudFrontDistribution(
    buckets: { website: s3.Bucket; images: s3.Bucket },
    api: apigateway.RestApi
  ): cloudfront.Distribution {
    // Create Origin Access Control for S3 bucket access
    const oac = new cloudfront.S3OriginAccessControl(this, 'WebsiteOAC', {
      description: 'OAC for Mad Libs website bucket',
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'WebsiteDistribution', {
      comment: 'Mad Libs Game CloudFront Distribution',
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe for cost optimization
      
      // Default behavior for static website content
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(buckets.website, {
          originAccessControl: oac,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },

      // Additional behaviors
      additionalBehaviors: {
        // API Gateway behavior
        '/api/*': {
          origin: new origins.RestApiOrigin(api),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
          cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED, // Don't cache API responses
          originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        },
        
        // Images behavior (if we want to serve images through CloudFront)
        '/images/*': {
          origin: origins.S3BucketOrigin.withOriginAccessControl(buckets.images, {
            originAccessControl: oac,
          }),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
      },

      // Error responses
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing support
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html', // SPA routing support
          ttl: cdk.Duration.minutes(5),
        },
      ],

      // Enable logging
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'CloudFrontLogsBucket', {
        bucketName: `${this.stackName.toLowerCase()}-cloudfront-logs-${this.account}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Enable ACLs for CloudFront logging
        lifecycleRules: [
          {
            id: 'DeleteOldLogs',
            enabled: true,
            expiration: cdk.Duration.days(30), // Keep logs for 30 days
          },
        ],
      }),
      logFilePrefix: 'cloudfront-logs/',
    });

    // Grant CloudFront access to S3 buckets
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

    // Apply tags to CloudFront distribution
    cdk.Tags.of(distribution).add('Project', 'MadLibsGame');
    cdk.Tags.of(distribution).add('Environment', process.env.NODE_ENV || 'development');
    cdk.Tags.of(distribution).add('Component', 'CDN');

    // Output CloudFront information
    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'ID of the CloudFront distribution',
      exportName: `${this.stackName}-CloudFrontDistributionId`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'Domain name of the CloudFront distribution',
      exportName: `${this.stackName}-CloudFrontDomainName`,
    });

    new cdk.CfnOutput(this, 'WebsiteUrl', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'URL of the deployed website',
      exportName: `${this.stackName}-WebsiteUrl`,
    });

    return distribution;
  }

  private updateLambdaS3Permissions(
    functions: { [key: string]: lambda.Function },
    buckets: { website: s3.Bucket; images: s3.Bucket }
  ): void {
    // Grant image generation Lambda access to images bucket
    buckets.images.grantReadWrite(functions.imageGeneration);
    
    // Grant other functions read access to images bucket for signed URL generation
    buckets.images.grantRead(functions.storyGeneration);
    buckets.images.grantRead(functions.storyFill);
    
    // Update environment variables with bucket names
    functions.imageGeneration.addEnvironment('IMAGES_BUCKET_NAME', buckets.images.bucketName);
    functions.storyGeneration.addEnvironment('IMAGES_BUCKET_NAME', buckets.images.bucketName);
    functions.storyFill.addEnvironment('IMAGES_BUCKET_NAME', buckets.images.bucketName);
    
    // Lambda functions will use their execution roles for AWS service access
  }

  private storeCloudFrontDomain(distribution: cloudfront.Distribution): void {
    // Store CloudFront domain in Parameter Store for Lambda functions to access
    new ssm.StringParameter(this, 'CloudFrontDomainParameter', {
      parameterName: `/madlibs/${this.stackName.toLowerCase()}/cloudfront-domain`,
      stringValue: distribution.distributionDomainName,
      description: 'CloudFront distribution domain name for Mad Libs application',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Also store the distribution ID for cache invalidation
    new ssm.StringParameter(this, 'CloudFrontDistributionIdParameter', {
      parameterName: `/madlibs/${this.stackName.toLowerCase()}/cloudfront-distribution-id`,
      stringValue: distribution.distributionId,
      description: 'CloudFront distribution ID for Mad Libs application',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Output the parameter names for reference
    new cdk.CfnOutput(this, 'CloudFrontDomainParameterName', {
      value: `/madlibs/${this.stackName.toLowerCase()}/cloudfront-domain`,
      description: 'Parameter Store name for CloudFront domain',
      exportName: `${this.stackName}-CloudFrontDomainParameter`,
    });
  }


}