---
inclusion: always
---

# TDD Workflow - Step-by-Step Process for Kiro

## Mandatory TDD Process

**Every code change MUST follow this exact workflow. No exceptions.**

## Pre-Development Checklist

Before writing ANY code:
- [ ] Understand the requirement completely
- [ ] Identify the expected behavior
- [ ] Plan the test cases (success, error, edge cases)
- [ ] Choose the appropriate test location and type

## TDD Workflow Steps

### Step 1: Create Test File (if new)
```bash
# Frontend component test
touch src/__tests__/components/ComponentName.test.tsx

# Frontend utility test  
touch src/__tests__/utils/utilityName.test.ts

# Lambda service test
touch lambda/src/__tests__/services/ServiceName.test.ts

# Lambda handler test
touch lambda/src/__tests__/handlers/handlerName.test.ts
```

### Step 2: Write Failing Test
Write the test that describes the desired behavior:

```typescript
// Example: New feature test
describe('FeatureName', () => {
  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Step 3: Run Test (Confirm Failure)
```bash
# Frontend
npm test -- ComponentName.test.tsx

# Lambda
cd lambda && npm test -- ServiceName.test.ts
```

**Expected Result**: Test should FAIL (RED phase)
- If test passes, the test is wrong or feature already exists
- If test has errors, fix the test setup first

### Step 4: Write Minimal Implementation
Create the simplest code that makes the test pass:

```typescript
// Minimal implementation - just make it work
export function functionUnderTest(input: string): string {
  return 'expected output'; // Hardcoded is OK for first pass
}
```

### Step 5: Run Test (Confirm Pass)
```bash
npm test -- ComponentName.test.tsx
```

**Expected Result**: Test should PASS (GREEN phase)

### Step 6: Add More Test Cases
Add tests for edge cases and error scenarios:

```typescript
describe('FeatureName', () => {
  it('should perform expected behavior', () => {
    // Original test
  });

  it('should handle empty input', () => {
    expect(() => functionUnderTest('')).toThrow('Input cannot be empty');
  });

  it('should handle null input', () => {
    expect(() => functionUnderTest(null)).toThrow('Input is required');
  });
});
```

### Step 7: Improve Implementation
Make tests pass with proper implementation:

```typescript
export function functionUnderTest(input: string): string {
  if (!input) {
    throw new Error('Input is required');
  }
  if (input.trim() === '') {
    throw new Error('Input cannot be empty');
  }
  
  // Actual implementation logic
  return processInput(input);
}
```

### Step 8: Refactor (if needed)
Improve code quality while keeping tests green:

```typescript
export function functionUnderTest(input: string): string {
  validateInput(input);
  return processInput(input);
}

function validateInput(input: string): void {
  if (!input) {
    throw new Error('Input is required');
  }
  if (input.trim() === '') {
    throw new Error('Input cannot be empty');
  }
}
```

### Step 9: Final Test Run
```bash
npm test -- ComponentName.test.tsx
```

**All tests must pass before considering the task complete.**

## TDD Templates for Common Scenarios

### React Component TDD
```typescript
// 1. Test first
describe('UserProfileCard', () => {
  it('should display user name and avatar', () => {
    const user = { name: 'John Doe', avatar: 'avatar.jpg' };
    render(<UserProfileCard user={user} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('John Doe avatar')).toHaveAttribute('src', 'avatar.jpg');
  });

  it('should show default avatar when none provided', () => {
    const user = { name: 'John Doe' };
    render(<UserProfileCard user={user} />);
    
    expect(screen.getByAltText('John Doe avatar')).toHaveAttribute('src', '/default-avatar.png');
  });
});

// 2. Implement component
export const UserProfileCard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="user-profile-card">
      <img 
        src={user.avatar || '/default-avatar.png'} 
        alt={`${user.name} avatar`} 
      />
      <h3>{user.name}</h3>
    </div>
  );
};
```

### Service Class TDD
```typescript
// 1. Test first
describe('GameSessionManager', () => {
  let manager: GameSessionManager;

  beforeEach(() => {
    GameSessionManager.resetInstance();
    manager = GameSessionManager.getInstance();
  });

  it('should create new game session', () => {
    const session = manager.createSession('host-123');
    
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('hostId', 'host-123');
    expect(session.players).toHaveLength(1);
  });

  it('should generate unique room codes', () => {
    const session1 = manager.createSession('host-1');
    const session2 = manager.createSession('host-2');
    
    expect(session1.roomCode).not.toBe(session2.roomCode);
  });
});

// 2. Implement service
export class GameSessionManager {
  private static instance: GameSessionManager | null = null;
  private sessions: Map<string, GameSession> = new Map();

  static getInstance(): GameSessionManager {
    if (!this.instance) {
      this.instance = new GameSessionManager();
    }
    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }

  createSession(hostId: string): GameSession {
    const session: GameSession = {
      id: generateId(),
      roomCode: generateRoomCode(),
      hostId,
      players: [{ id: hostId, isHost: true }],
      createdAt: new Date()
    };
    
    this.sessions.set(session.id, session);
    return session;
  }
}
```

### API Handler TDD
```typescript
// 1. Test first
describe('create-game handler', () => {
  it('should create new game successfully', async () => {
    const event = createMockEvent({
      body: JSON.stringify({ hostId: 'user-123' })
    });

    const result = await handler(event);
    
    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body).toHaveProperty('gameId');
    expect(body).toHaveProperty('roomCode');
  });

  it('should return 400 for missing hostId', async () => {
    const event = createMockEvent({
      body: JSON.stringify({})
    });

    const result = await handler(event);
    
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toHaveProperty('error');
  });
});

// 2. Implement handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { hostId } = JSON.parse(event.body || '{}');
    
    if (!hostId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'hostId is required' })
      };
    }

    const gameManager = GameSessionManager.getInstance();
    const session = gameManager.createSession(hostId);

    return {
      statusCode: 201,
      body: JSON.stringify({
        gameId: session.id,
        roomCode: session.roomCode
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

## TDD Quality Gates

### Before Moving to Next Step:
- [ ] Current test fails for the right reason
- [ ] Implementation makes test pass
- [ ] No other tests are broken
- [ ] Code is clean and readable

### Before Completing Feature:
- [ ] All happy path scenarios tested
- [ ] All error scenarios tested
- [ ] Edge cases covered
- [ ] Mocks are properly configured
- [ ] Tests run in isolation
- [ ] Code coverage is adequate

## TDD Anti-Patterns to Avoid

### ❌ Don't Do This:
```typescript
// Writing implementation first
export function badExample() {
  return 'implementation';
}

// Then writing test
it('should work', () => {
  expect(badExample()).toBe('implementation');
});
```

### ✅ Do This Instead:
```typescript
// Write test first
it('should return processed result', () => {
  expect(goodExample('input')).toBe('processed input');
});

// Then implement
export function goodExample(input: string): string {
  return `processed ${input}`;
}
```

## TDD Commands Reference

### Quick TDD Cycle
```bash
# 1. Write test
# 2. Run test (should fail)
npm test -- MyFeature.test.ts

# 3. Write minimal code
# 4. Run test (should pass)
npm test -- MyFeature.test.ts

# 5. Refactor
# 6. Run test (should still pass)
npm test -- MyFeature.test.ts
```

### Watch Mode for TDD
```bash
# Frontend
npm test -- --watch MyComponent.test.tsx

# Lambda
cd lambda && npm test -- --watch MyService.test.ts
```

### Debug TDD Issues
```bash
# Verbose output
npm test -- --verbose MyFeature.test.ts

# Single test
npm test -- --testNamePattern="specific test name"
```

## TDD Success Metrics

### For Each Feature:
- ✅ Test written before implementation
- ✅ Test failed initially (RED)
- ✅ Minimal code made test pass (GREEN)
- ✅ Code refactored while keeping tests green
- ✅ Edge cases and errors tested
- ✅ All tests pass consistently

### For Each Sprint:
- ✅ 90%+ test coverage on new code
- ✅ Zero failing tests in CI/CD
- ✅ All features have comprehensive tests
- ✅ Bug fixes include regression tests

## Remember: TDD is the ONLY Way

**No code gets written without tests first. Period.**

This ensures:
- 🎯 Clear requirements understanding
- 🛡️ Robust error handling
- 🔧 Easier debugging and maintenance
- 🚀 Confident deployments
- 📈 High code quality