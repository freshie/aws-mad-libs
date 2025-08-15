# Testing Architecture - Internal Kiro Documentation

This document provides detailed technical information about the testing setup for AI Mad Libs, specifically for Kiro's understanding when working with tests.

## Test Execution Context

### Frontend Tests (React/TypeScript)
- **Location**: `src/__tests__/`
- **Runner**: Jest with jsdom environment
- **Command**: `npm test` (from project root)
- **Config**: `jest.config.js` in project root

### Lambda Tests (Node.js/TypeScript)
- **Location**: `lambda/src/__tests__/`
- **Runner**: Jest with node environment  
- **Command**: `npm test` (from lambda directory)
- **Config**: `lambda/jest.config.js`

## Key Configuration Details

### TypeScript Integration
Both test suites use `ts-jest` preset for TypeScript compilation:
```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node', // or 'jsdom' for frontend
}
```

### Module Resolution
Lambda tests use path mapping for cleaner imports:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

### Test File Patterns
- Frontend: `**/__tests__/**/*.{test,spec}.{ts,tsx}`
- Lambda: `**/__tests__/**/*.test.ts`

## Mocking Strategies

### AWS SDK Mocking Pattern
```typescript
// Standard pattern for mocking AWS services
jest.mock('@aws-sdk/client-bedrock-runtime');
const mockClient = ClientClass as jest.MockedClass<typeof ClientClass>;
const mockSend = jest.fn();
mockClient.prototype.send = mockSend;
```

### Singleton Service Mocking
Services use singleton pattern with reset capability for testing:
```typescript
export class ServiceClass {
  private static instance: ServiceClass | null = null;
  
  public static resetInstance(): void {
    ServiceClass.instance = null;
  }
}
```

### Global Mocks Setup
Environment variables and global functions are mocked in setup files:
```javascript
// lambda/jest.setup.js
process.env.CLOUDFRONT_DOMAIN = 'test-cloudfront-domain.cloudfront.net';
global.fetch = jest.fn();
```

## Test Data Patterns

### Mock Data Structure
Tests use realistic mock data that matches actual service interfaces:
```typescript
const mockStoryInput: StoryVideoInput = {
  title: 'Test Story',
  images: [
    { url: 'https://example.com/image1.jpg', text: 'Scene description', duration: 4 }
  ],
  overallNarrative: 'Story narrative text'
};
```

### Response Mocking
AWS service responses are mocked with proper structure:
```typescript
mockSend.mockResolvedValue({
  body: new TextEncoder().encode(JSON.stringify({
    images: [Buffer.from('fake-image-data').toString('base64')]
  }))
});
```

## Error Handling Testing

### Expected Error Patterns
```typescript
// Test that errors are properly thrown
await expect(service.method()).rejects.toThrow('Expected error message');

// Test error handling with fallbacks
mockSend.mockRejectedValue(new Error('API Error'));
const result = await service.methodWithFallback();
expect(result).toHaveProperty('fallbackProperty');
```

### Retry Logic Testing
Services with retry logic are tested with multiple mock responses:
```typescript
mockSend
  .mockRejectedValueOnce(new Error('First failure'))
  .mockRejectedValueOnce(new Error('Second failure'))
  .mockResolvedValue(successResponse);
```

## Service-Specific Testing Notes

### StoryGenerator
- Uses Bedrock Nova Lite model
- Falls back to mock templates on API failure
- Tests both AI generation and template filling
- Placeholder format: `{wordType}` (not `[WORDTYPE]`)

### ImageGenerator
- Uses Bedrock Nova Canvas model
- Supports both text-to-image and image variation
- Tests retry logic with exponential backoff
- Mocks both Bedrock and S3 operations

### VideoGenerator
- Uses Nova Reel model (currently mocked)
- Downloads images and converts to base64
- Creates mock video files when Nova Reel unavailable
- Tests image download error handling

## Test Execution Flow

### Pre-test Setup
1. Jest loads configuration
2. Setup files run (environment variables, global mocks)
3. Module mocks are applied
4. Test files are discovered and loaded

### Per-test Execution
1. `beforeEach` hooks run (reset singletons, clear mocks)
2. Test function executes
3. Assertions are evaluated
4. Cleanup occurs automatically

### Post-test Cleanup
1. Mocks are reset (if configured)
2. Singleton instances are cleared
3. Memory is garbage collected

## Debugging Test Issues

### Common Failure Patterns

1. **Import Path Issues**
   - Symptom: `Cannot find module` errors
   - Solution: Check relative paths, verify `moduleNameMapper`

2. **Mock Not Applied**
   - Symptom: Real services called instead of mocks
   - Solution: Ensure mock declaration before imports

3. **Async Test Failures**
   - Symptom: Tests timeout or don't wait for promises
   - Solution: Use `async/await`, increase timeout

4. **Type Mismatches**
   - Symptom: TypeScript compilation errors in tests
   - Solution: Update test data to match service interfaces

### Debug Commands for Kiro
```bash
# Run specific test file
npm test -- --testPathPattern="StoryGenerator.test.ts"

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="should generate story templates"

# Clear Jest cache
npm test -- --clearCache
```

## Integration with Kiro Workflows

### When Running Tests
1. Always run from correct directory (root for frontend, lambda/ for backend)
2. Check that all dependencies are installed (`npm ci`)
3. Ensure environment variables are set in test setup
4. Monitor for timeout issues with AWS service mocks

### When Modifying Tests
1. Update mock data when service interfaces change
2. Add new mocks when adding external dependencies
3. Maintain test coverage for critical paths
4. Update setup files when adding new environment variables

### When Adding New Services
1. Create corresponding test file in `__tests__/services/`
2. Mock all external dependencies (AWS, HTTP, etc.)
3. Test both success and error scenarios
4. Add singleton reset if service uses singleton pattern

## Performance Considerations

### Test Execution Speed
- Mocks prevent actual API calls (faster execution)
- Parallel test execution enabled by default
- Setup files run once per test suite

### Memory Management
- Singleton reset prevents memory leaks between tests
- Mock cleanup prevents accumulation of mock data
- Jest automatically manages test isolation

## Coverage Expectations

### Critical Paths (100% coverage expected)
- Service initialization and configuration
- Core business logic (story generation, image processing)
- Error handling and fallback mechanisms

### Secondary Paths (80%+ coverage expected)
- Utility functions
- Data transformation logic
- API response parsing

### Optional Coverage
- Logging and debugging code
- Development-only features
- External service integration details