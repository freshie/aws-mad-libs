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
    // const lambdaFunctions = this.createLambdaFunctions(gameTable);
    
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
    // Will be implemented in Task 18
    throw new Error('Lambda functions creation not yet implemented');
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