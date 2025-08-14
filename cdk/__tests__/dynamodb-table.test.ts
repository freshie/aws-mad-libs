import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MadLibsServerlessStack } from '../mad-libs-serverless-stack';

describe('DynamoDB Table Configuration', () => {
  let template: Template;
  let stack: MadLibsServerlessStack;

  beforeAll(() => {
    const app = new cdk.App();
    stack = new MadLibsServerlessStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('Creates DynamoDB table with correct configuration', () => {
    // Verify table exists with correct properties
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      AttributeDefinitions: [
        {
          AttributeName: 'PK',
          AttributeType: 'S'
        },
        {
          AttributeName: 'SK',
          AttributeType: 'S'
        },
        {
          AttributeName: 'GSI1PK',
          AttributeType: 'S'
        },
        {
          AttributeName: 'GSI1SK',
          AttributeType: 'S'
        },
        {
          AttributeName: 'RoomCode',
          AttributeType: 'S'
        },
        {
          AttributeName: 'CreatedAt',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'PK',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'SK',
          KeyType: 'RANGE'
        }
      ],
      TimeToLiveSpecification: {
        AttributeName: 'TTL',
        Enabled: true
      },
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      },
      SSESpecification: {
        SSEEnabled: true
      }
    });
  });

  test('Creates Global Secondary Indexes', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      GlobalSecondaryIndexes: [
        {
          IndexName: 'GSI1',
          KeySchema: [
            {
              AttributeName: 'GSI1PK',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'GSI1SK',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'RoomCodeIndex',
          KeySchema: [
            {
              AttributeName: 'RoomCode',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'CreatedAt',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ]
    });
  });

  test('Has correct table name format', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: Match.stringLikeRegexp('.*-GameData')
    });
  });

  test('Includes proper tags', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      Tags: Match.arrayWith([
        {
          Key: 'Project',
          Value: 'MadLibsGame'
        }
      ])
    });
  });

  test('Creates CloudFormation outputs', () => {
    template.hasOutput('DynamoDBTableName', {
      Description: 'Name of the DynamoDB table for game data'
    });

    template.hasOutput('DynamoDBTableArn', {
      Description: 'ARN of the DynamoDB table'
    });
  });

  test('Table has deletion protection disabled for development', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      DeletionProtectionEnabled: false
    });
  });

  test('Uses AWS managed encryption', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      SSESpecification: {
        SSEEnabled: true
        // AWS managed key is default when no KMSMasterKeyId is specified
      }
    });
  });
});

describe('DynamoDB Access Patterns', () => {
  test('Access patterns are correctly defined', () => {
    const { AccessPatterns } = require('../../src/types/dynamodb');
    
    // Test game session pattern
    const gamePattern = AccessPatterns.GET_GAME_SESSION('test-game-123');
    expect(gamePattern.PK).toBe('GAME#test-game-123');
    expect(gamePattern.SK).toBe('METADATA');
    
    // Test player pattern
    const playerPattern = AccessPatterns.GET_PLAYER('test-game-123', 'player-456');
    expect(playerPattern.PK).toBe('GAME#test-game-123');
    expect(playerPattern.SK).toBe('PLAYER#player-456');
    
    // Test template pattern
    const templatePattern = AccessPatterns.GET_TEMPLATE('adventure', 'template-789');
    expect(templatePattern.PK).toBe('TEMPLATE#adventure');
    expect(templatePattern.SK).toBe('TEMPLATE#template-789');
  });

  test('TTL helpers calculate correct timestamps', () => {
    const { TTLHelpers } = require('../../src/types/dynamodb');
    
    const now = Math.floor(Date.now() / 1000);
    const gameSessionTTL = TTLHelpers.GAME_SESSION_TTL();
    const storyTTL = TTLHelpers.COMPLETED_STORY_TTL();
    
    // Game session TTL should be 24 hours from now
    expect(gameSessionTTL).toBeGreaterThan(now + (23 * 60 * 60));
    expect(gameSessionTTL).toBeLessThan(now + (25 * 60 * 60));
    
    // Story TTL should be 24 hours from now (same as game sessions)
    expect(storyTTL).toBeGreaterThan(now + (23 * 60 * 60));
    expect(storyTTL).toBeLessThan(now + (25 * 60 * 60));
  });
});