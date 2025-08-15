# Testing Quick Reference

## Running Tests

### Frontend Tests
```bash
npm test                    # Watch mode
npm run test:ci            # Single run
npm run test:coverage      # With coverage
```

### Lambda Tests
```bash
cd lambda
npm test                    # All tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Specific Tests
```bash
# Run specific test file
npm test -- ComponentName.test.tsx

# Run specific test case
npm test -- --testNamePattern="should render correctly"

# Run tests matching pattern
npm test -- --testPathPattern="services"
```

## Test File Structure

### Component Test Template
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../../components/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const mockHandler = jest.fn();
    render(<ComponentName onAction={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalled();
  });
});
```

### Service Test Template
```typescript
import { ServiceClass } from '../../services/ServiceClass';

// Mock external dependencies
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('ServiceClass', () => {
  let service: ServiceClass;

  beforeEach(() => {
    jest.clearAllMocks();
    ServiceClass.resetInstance();
    service = ServiceClass.getInstance();
  });

  it('should perform expected operation', async () => {
    const result = await service.someMethod();
    expect(result).toHaveProperty('expectedProperty');
  });

  it('should handle errors gracefully', async () => {
    // Mock error response
    mockSend.mockRejectedValue(new Error('Test Error'));
    
    await expect(service.someMethod()).rejects.toThrow('Test Error');
  });
});
```

## Common Mocking Patterns

### AWS SDK Mock
```typescript
jest.mock('@aws-sdk/client-bedrock-runtime');
const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockSend = jest.fn();
mockBedrockClient.prototype.send = mockSend;

// Mock successful response
mockSend.mockResolvedValue({
  body: new TextEncoder().encode(JSON.stringify({ data: 'response' }))
});
```

### Fetch Mock
```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({ data: 'response' }),
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
});
```

### Environment Variables
```typescript
// In jest.setup.js or beforeEach
process.env.TEST_VAR = 'test-value';
```

## Assertion Patterns

### Basic Assertions
```typescript
expect(value).toBe(expected);                    // Exact equality
expect(value).toEqual(expected);                 // Deep equality
expect(value).toHaveProperty('prop');            // Property exists
expect(value).toHaveProperty('prop', 'value');   // Property with value
expect(array).toHaveLength(3);                   // Array length
expect(value).toBeGreaterThan(0);               // Numeric comparison
expect(string).toContain('substring');           // String contains
expect(string).toMatch(/pattern/);               // Regex match
```

### Async Assertions
```typescript
await expect(promise).resolves.toBe(value);      // Promise resolves to value
await expect(promise).rejects.toThrow('error');  // Promise rejects with error
```

### Mock Assertions
```typescript
expect(mockFn).toHaveBeenCalled();               // Function was called
expect(mockFn).toHaveBeenCalledWith(arg1, arg2); // Called with specific args
expect(mockFn).toHaveBeenCalledTimes(2);         // Called specific number of times
expect(mockFn).toHaveBeenLastCalledWith(arg);    // Last call had specific args
```

### DOM Assertions (Frontend)
```typescript
expect(element).toBeInTheDocument();             // Element exists in DOM
expect(element).toHaveTextContent('text');       // Element has text
expect(element).toHaveClass('className');        // Element has CSS class
expect(element).toBeVisible();                   // Element is visible
expect(element).toBeDisabled();                  // Element is disabled
```

## Debugging Tests

### Debug Single Test
```bash
npm test -- --testNamePattern="specific test name" --verbose
```

### Debug with Console Output
```typescript
console.log('Debug value:', value);  // Will show in test output
```

### Debug Mock Calls
```typescript
console.log('Mock calls:', mockFn.mock.calls);
console.log('Mock results:', mockFn.mock.results);
```

### Run Without Cache
```bash
npm test -- --no-cache
```

## Common Issues & Solutions

### Issue: "Cannot find module"
**Solution**: Check import paths, ensure relative paths are correct
```typescript
// Correct
import { Service } from '../../services/Service';
// Incorrect  
import { Service } from '../services/Service';
```

### Issue: "Mock not working"
**Solution**: Ensure mock is declared before imports
```typescript
// Correct order
jest.mock('@aws-sdk/client-bedrock-runtime');
import { Service } from './Service';

// Incorrect order
import { Service } from './Service';
jest.mock('@aws-sdk/client-bedrock-runtime');
```

### Issue: "Test timeout"
**Solution**: Increase timeout or fix async handling
```typescript
// Increase timeout
jest.setTimeout(30000);

// Fix async
await expect(asyncFunction()).resolves.toBe(value);
```

### Issue: "Singleton not reset"
**Solution**: Reset in beforeEach
```typescript
beforeEach(() => {
  ServiceClass.resetInstance();
});
```

## Test Coverage

### View Coverage Report
```bash
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
start coverage/lcov-report/index.html # Windows
```

### Coverage Thresholds
- **Critical paths**: 100%
- **Business logic**: 90%+
- **Utilities**: 80%+
- **UI components**: 70%+

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests focused and simple**
4. **Mock external dependencies**
5. **Test both success and error cases**
6. **Clean up after tests (reset mocks, singletons)**
7. **Use proper async/await for promises**
8. **Group related tests with describe blocks**