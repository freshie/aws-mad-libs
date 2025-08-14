import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MadLibsServerlessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Placeholder resources - will be implemented in subsequent tasks
    
    // DynamoDB Table (Task 17)
    const gameTable = this.createDynamoDBTable();
    
    // Lambda Functions (Task 18)
    const lambdaFunctions = this.createLambdaFunctions(gameTable);
    
    // S3 Buckets (Task 20)
    // const buckets = this.createS3Buckets();
    
    // API Gateway (Task 21)
    // const api = this.createApiGateway(lambdaFunctions);
    
    // CloudFront Distribution (Task 20)
    // const distribution = this.createCloudFrontDistribution(buckets, api);
    
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
      tableName: `${this.stackName}-GameData`,
      
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
      description: 'Generates images using AWS Bedrock Nova Canvas',
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
    table.grantReadData(testAwsFunction);

    // Grant Bedrock permissions
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

    storyGenerationFunction.addToRolePolicy(bedrockPolicy);
    storyFillFunction.addToRolePolicy(bedrockPolicy);
    imageGenerationFunction.addToRolePolicy(bedrockPolicy);

    // Grant S3 permissions for image storage
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl',
        's3:GetObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetBucketLocation',
      ],
      resources: [
        'arn:aws:s3:::ai-mad-libs-*',
        'arn:aws:s3:::ai-mad-libs-*/*',
      ],
    });

    imageGenerationFunction.addToRolePolicy(s3Policy);

    // Apply tags to all Lambda functions
    const functions = [storyGenerationFunction, storyFillFunction, imageGenerationFunction, testAwsFunction];
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

    return {
      storyGeneration: storyGenerationFunction,
      storyFill: storyFillFunction,
      imageGeneration: imageGenerationFunction,
      testAws: testAwsFunction,
    };
  }
  
  private createS3Buckets(): { website: s3.Bucket; images: s3.Bucket } {
    // Will be implemented in Task 20
    throw new Error('S3 buckets creation not yet implemented');
  }
  
  private createApiGateway(functions: { [key: string]: lambda.Function }): apigateway.RestApi {
    // Will be implemented in Task 21
    throw new Error('API Gateway creation not yet implemented');
  }
  
  private createCloudFrontDistribution(
    buckets: { website: s3.Bucket; images: s3.Bucket },
    api: apigateway.RestApi
  ): cloudfront.Distribution {
    // Will be implemented in Task 20
    throw new Error('CloudFront distribution creation not yet implemented');
  }
}