# DynamoDB Single-Table Design for Mad Libs Game

## Overview

The Mad Libs serverless application uses a single DynamoDB table design for optimal performance and cost efficiency. This approach minimizes the number of tables while supporting all required access patterns.

## Table Structure

### Primary Table: `MadLibsServerlessStack-GameData`

**Primary Key:**
- **Partition Key (PK):** String - Primary identifier for data partitioning
- **Sort Key (SK):** String - Secondary identifier for sorting within partition

**Global Secondary Indexes:**
- **GSI1:** Alternative access patterns with GSI1PK and GSI1SK
- **RoomCodeIndex:** Quick lookup by room code with CreatedAt for sorting

**Configuration:**
- **Billing Mode:** PAY_PER_REQUEST (cost-optimized for variable workloads)
- **TTL:** Automatic cleanup of expired game sessions
- **Encryption:** AWS managed encryption at rest
- **Point-in-time Recovery:** Enabled for data protection

## Entity Types and Access Patterns

### 1. Game Sessions
```
PK: GAME#{gameId}
SK: METADATA
EntityType: GAME_SESSION
```

**Attributes:**
- GameId, RoomCode, HostId
- GameState, PlayerCount, MaxPlayers
- Theme, StoryTemplateId, CompletedStoryId
- CreatedAt, UpdatedAt, TTL (24 hours)

**Access Patterns:**
- Get game by ID: `PK = GAME#{gameId}, SK = METADATA`
- Get game by room code: `RoomCodeIndex` with `RoomCode = {code}`

### 2. Players
```
PK: GAME#{gameId}
SK: PLAYER#{playerId}
EntityType: PLAYER
```

**Attributes:**
- GameId, PlayerId, Username
- IsHost, IsConnected, WordsContributed
- JoinedAt, LastActiveAt

**Access Patterns:**
- Get all players in game: `PK = GAME#{gameId}, SK begins_with PLAYER#`
- Get specific player: `PK = GAME#{gameId}, SK = PLAYER#{playerId}`

### 3. Story Templates
```
PK: TEMPLATE#{theme}
SK: TEMPLATE#{templateId}
EntityType: STORY_TEMPLATE
```

**Attributes:**
- TemplateId, Theme, Title
- Paragraphs (nested JSON), TotalWordBlanks
- Difficulty, CreatedAt, IsActive

**Access Patterns:**
- Get templates by theme: `PK = TEMPLATE#{theme}, SK begins_with TEMPLATE#`
- Get specific template: `PK = TEMPLATE#{theme}, SK = TEMPLATE#{templateId}`

### 4. Word Submissions
```
PK: GAME#{gameId}
SK: WORD#{wordId}
EntityType: WORD_SUBMISSION
```

**Attributes:**
- GameId, WordId, WordBlankId
- PlayerId, PlayerUsername, Word
- WordType, Position, SubmittedAt

**Access Patterns:**
- Get all words for game: `PK = GAME#{gameId}, SK begins_with WORD#`
- Get words by position: Sort by Position attribute

### 5. Completed Stories
```
PK: GAME#{gameId}
SK: STORY#{storyId}
EntityType: COMPLETED_STORY
```

**Attributes:**
- GameId, StoryId, Title
- Paragraphs (nested JSON), PlayerContributions
- ImageUrls, CreatedAt, GenerationTimeMs
- TTL (24 hours - same as game sessions)

**Access Patterns:**
- Get story for game: `PK = GAME#{gameId}, SK = STORY#{storyId}`

## Query Examples

### TypeScript Query Examples

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Get game session by ID
const getGameSession = async (gameId: string) => {
  const command = new GetCommand({
    TableName: 'MadLibsServerlessStack-GameData',
    Key: {
      PK: `GAME#${gameId}`,
      SK: 'METADATA'
    }
  });
  return await client.send(command);
};

// Get all players in a game
const getPlayersInGame = async (gameId: string) => {
  const command = new QueryCommand({
    TableName: 'MadLibsServerlessStack-GameData',
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `GAME#${gameId}`,
      ':sk': 'PLAYER#'
    }
  });
  return await client.send(command);
};

// Get game by room code
const getGameByRoomCode = async (roomCode: string) => {
  const command = new QueryCommand({
    TableName: 'MadLibsServerlessStack-GameData',
    IndexName: 'RoomCodeIndex',
    KeyConditionExpression: 'RoomCode = :roomCode',
    ExpressionAttributeValues: {
      ':roomCode': roomCode
    },
    Limit: 1
  });
  return await client.send(command);
};

// Get story templates by theme
const getTemplatesByTheme = async (theme: string) => {
  const command = new QueryCommand({
    TableName: 'MadLibsServerlessStack-GameData',
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `TEMPLATE#${theme}`,
      ':sk': 'TEMPLATE#'
    },
    FilterExpression: 'IsActive = :active',
    ExpressionAttributeValues: {
      ':active': true
    }
  });
  return await client.send(command);
};
```

## Performance Considerations

### Read Patterns
- **Hot Partitions:** Game sessions are distributed across different partition keys
- **Query Efficiency:** Most queries use partition key + sort key prefix for optimal performance
- **GSI Usage:** Room code lookups use dedicated GSI to avoid full table scans

### Write Patterns
- **Batch Operations:** Word submissions can be batched for better throughput
- **Conditional Writes:** Prevent duplicate room codes and concurrent modifications
- **TTL Cleanup:** Automatic cleanup reduces storage costs and improves performance

### Cost Optimization
- **Pay-per-request:** No provisioned capacity needed for variable workloads
- **Single Table:** Reduces costs compared to multiple tables
- **TTL:** Automatic cleanup prevents unbounded growth
- **Efficient Queries:** Minimize RCU/WCU usage with proper key design

## Scaling Characteristics

### Read Scaling
- **Partition Distribution:** Game IDs provide natural distribution
- **GSI Scaling:** Room code index scales independently
- **Caching:** Lambda functions can cache frequently accessed templates

### Write Scaling
- **Concurrent Games:** Each game writes to different partitions
- **Batch Writes:** Word submissions can be batched
- **Auto-scaling:** Pay-per-request handles traffic spikes automatically

## Data Lifecycle and Retention

### Permanent Data (No TTL)
- **Story Templates** - Kept forever for reuse across games
- **Template metadata** - Theme, difficulty, word blanks structure
- **System configuration** - Game rules, word types, etc.

### Temporary Data (24-hour TTL)
- **Game Sessions** - Room codes, player lists, game state
- **Player Records** - Usernames, connection status, contributions
- **Word Submissions** - Individual word entries by players
- **Completed Stories** - Final stories with player words filled in
- **Generated Images** - AI-created images for story paragraphs

### Benefits of 24-Hour Cleanup
- **Cost Control** - Prevents unbounded storage growth
- **Privacy** - Player data automatically removed
- **Performance** - Keeps table size manageable
- **Compliance** - Automatic data retention policy

## Data Consistency

### Strong Consistency
- Game session metadata updates
- Player join/leave operations
- Story completion status

### Eventual Consistency
- Word submission aggregation
- Player activity timestamps
- Template usage statistics

## Backup and Recovery

### Point-in-time Recovery
- Enabled for data protection
- 35-day retention period
- Granular recovery to specific timestamp

### TTL-based Cleanup
- Game sessions: 24 hours
- Completed stories: 24 hours
- Word submissions: Inherit from game session
- Templates: No expiration

## Monitoring and Alerting

### CloudWatch Metrics
- Read/Write capacity utilization
- Throttled requests
- User errors vs system errors
- GSI performance metrics

### Recommended Alarms
- High error rates (> 1%)
- Throttling events
- TTL deletion failures
- Point-in-time recovery issues

## Migration Considerations

### From Current Local State
1. **Game Sessions:** Convert LocalGameContext to DynamoDB records
2. **Players:** Store player data persistently
3. **Templates:** Migrate from in-memory to DynamoDB storage
4. **Stories:** Persist completed stories for sharing

### Data Migration Scripts
- Export existing templates to DynamoDB format
- Validate access patterns with test data
- Performance testing with realistic workloads
- Rollback procedures for failed migrations