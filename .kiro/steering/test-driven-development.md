---
inclusion: always
---

# Test-Driven Development (TDD) Guidelines for Kiro

## TDD Mandate

**ALWAYS follow Test-Driven Development when implementing new features or fixing bugs.**

## The TDD Cycle (Red-Green-Refactor)

### 1. RED - Write a Failing Test First
- Write the test BEFORE implementing any functionality
- The test should fail initially (red)
- Define the expected behavior and interface

### 2. GREEN - Write Minimal Code to Pass
- Implement just enough code to make the test pass
- Don't worry about perfect code yet
- Focus on making it work, not making it beautiful

### 3. REFACTOR - Improve the Code
- Clean up the implementation
- Improve structure, readability, performance
- Ensure tests still pass after refactoring

## TDD Implementation Process for Kiro

### Step 1: Analyze the Requirement
Before writing any code:
1. Understand what needs to be built
2. Identify the expected inputs and outputs
3. Consider edge cases and error scenarios
4. Plan the test cases

### Step 2: Write the Test First
```typescript
// Example: Adding a new utility function
describe('generateUniqueId', () => {
  it('should generate a unique identifier', () => {
    const id = generateUniqueId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate different IDs on subsequent calls', () => {
    const id1 = generateUniqueId();
    const id2 = generateUniqueId();
    expect(id1).not.toBe(id2);
  });
});
```

### Step 3: Run the Test (Should Fail)
```bash
npm test -- generateUniqueId.test.ts
# Should show failing test - this is expected!
```

### Step 4: Implement Minimal Code
```typescript
// Minimal implementation to pass the test
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
```

### Step 5: Run Test Again (Should Pass)
```bash
npm test -- generateUniqueId.test.ts
# Should now pass - GREEN phase complete
```

### Step 6: Refactor if Needed
```typescript
// Improved implementation
import { v4 as uuidv4 } from 'uuid';

export function generateUniqueId(): string {
  return uuidv4();
}
```

## TDD for Different Code Types

### Frontend Components (React)
```typescript
// 1. Write test first
describe('GameStatusBadge', () => {
  it('should display waiting status', () => {
    render(<GameStatusBadge status="waiting" />);
    expect(screen.getByText('Waiting for Players')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveClass('status-waiting');
  });
});

// 2. Implement component
export const GameStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return (
    <div data-testid="status-badge" className={`status-${status}`}>
      {status === 'waiting' ? 'Waiting for Players' : status}
    </div>
  );
};
```

### Backend Services (Lambda)
```typescript
// 1. Write test first
describe('RoomCodeGenerator', () => {
  it('should generate 4-letter room codes', () => {
    const code = RoomCodeGenerator.generate();
    expect(code).toMatch(/^[A-Z]{4}$/);
  });

  it('should not generate duplicate codes in sequence', () => {
    const codes = Array.from({ length: 100 }, () => RoomCodeGenerator.generate());
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });
});

// 2. Implement service
export class RoomCodeGenerator {
  static generate(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length: 4 }, () => 
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
  }
}
```

### API Handlers
```typescript
// 1. Write test first
describe('join-game handler', () => {
  it('should allow player to join existing game', async () => {
    const event = createMockEvent({
      roomCode: 'ABCD',
      playerId: 'player-123',
      username: 'TestPlayer'
    });

    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      success: true,
      gameState: expect.objectContaining({
        players: expect.arrayContaining([
          expect.objectContaining({ username: 'TestPlayer' })
        ])
      })
    });
  });
});

// 2. Implement handler
export const handler = async (event: APIGatewayProxyEvent) => {
  const { roomCode, playerId, username } = JSON.parse(event.body || '{}');
  
  // Implementation follows...
};
```

## TDD Rules for Kiro

### ALWAYS Do This:
1. **Write tests before implementation**
2. **Run tests to ensure they fail first**
3. **Write minimal code to pass tests**
4. **Refactor while keeping tests green**
5. **Test both success and error cases**
6. **Mock external dependencies**

### NEVER Do This:
1. **Don't write implementation before tests**
2. **Don't skip the failing test step**
3. **Don't write tests after implementation**
4. **Don't ignore failing tests**
5. **Don't test implementation details**

## TDD for Bug Fixes

### Process:
1. **Reproduce the bug with a test**
2. **Confirm the test fails**
3. **Fix the bug**
4. **Confirm the test passes**
5. **Add additional tests for edge cases**

```typescript
// Example: Bug fix for room code validation
describe('validateRoomCode', () => {
  it('should reject room codes with numbers', () => {
    // This test reproduces the bug
    expect(() => validateRoomCode('AB12')).toThrow('Invalid room code format');
  });

  it('should reject room codes that are too short', () => {
    expect(() => validateRoomCode('ABC')).toThrow('Room code must be 4 characters');
  });
});
```

## TDD for Refactoring

### Process:
1. **Ensure existing tests pass**
2. **Add tests for new behavior if needed**
3. **Refactor implementation**
4. **Ensure all tests still pass**
5. **Remove obsolete tests if any**

## Mock Strategy in TDD

### External Services
```typescript
// Always mock external dependencies
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('../../services/ExternalService');

// Test the interface, not the implementation
it('should call external service with correct parameters', async () => {
  mockExternalService.mockResolvedValue(expectedResponse);
  
  await serviceUnderTest.method();
  
  expect(mockExternalService).toHaveBeenCalledWith(expectedParams);
});
```

## TDD Workflow Commands for Kiro

### Starting TDD Cycle
```bash
# 1. Create test file
touch src/__tests__/components/NewComponent.test.tsx

# 2. Write failing test
# 3. Run test to confirm failure
npm test -- NewComponent.test.tsx

# 4. Implement minimal code
# 5. Run test to confirm pass
npm test -- NewComponent.test.tsx

# 6. Refactor and re-run tests
npm test -- NewComponent.test.tsx
```

### TDD with Watch Mode
```bash
# Run tests in watch mode for continuous feedback
npm test -- --watch NewComponent.test.tsx
```

## TDD Benefits for This Project

### 1. **Reliable AWS Integration**
- Tests ensure AWS service mocks work correctly
- Prevents issues with actual AWS calls during development

### 2. **Component Reliability**
- React components work as expected
- User interactions are properly handled

### 3. **Service Layer Confidence**
- Business logic is thoroughly tested
- Error handling is verified

### 4. **Regression Prevention**
- Changes don't break existing functionality
- Refactoring is safe with comprehensive tests

## TDD Examples for Common Tasks

### Adding New Game Feature
```typescript
// 1. Test first
describe('GameTimer', () => {
  it('should countdown from specified time', () => {
    const timer = new GameTimer(60);
    expect(timer.getTimeRemaining()).toBe(60);
  });

  it('should emit event when time expires', (done) => {
    const timer = new GameTimer(1);
    timer.on('expired', () => {
      expect(timer.getTimeRemaining()).toBe(0);
      done();
    });
    timer.start();
  });
});

// 2. Implement
export class GameTimer extends EventEmitter {
  constructor(private seconds: number) {
    super();
  }
  
  getTimeRemaining(): number {
    return this.seconds;
  }
  
  start(): void {
    const interval = setInterval(() => {
      this.seconds--;
      if (this.seconds <= 0) {
        clearInterval(interval);
        this.emit('expired');
      }
    }, 1000);
  }
}
```

### Adding API Endpoint
```typescript
// 1. Test first
describe('GET /api/games/:id', () => {
  it('should return game details', async () => {
    const mockGame = { id: 'game-123', status: 'active' };
    mockGameService.getById.mockResolvedValue(mockGame);

    const event = createMockEvent({ pathParameters: { id: 'game-123' } });
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockGame);
  });
});

// 2. Implement handler
export const handler = async (event: APIGatewayProxyEvent) => {
  const gameId = event.pathParameters?.id;
  const game = await GameService.getInstance().getById(gameId);
  
  return {
    statusCode: 200,
    body: JSON.stringify(game)
  };
};
```

## Remember: TDD is Non-Negotiable

Every feature, bug fix, and refactoring MUST follow the TDD cycle. This ensures:
- ✅ Code quality and reliability
- ✅ Comprehensive test coverage
- ✅ Easier debugging and maintenance
- ✅ Confidence in deployments
- ✅ Better design through test-first thinking