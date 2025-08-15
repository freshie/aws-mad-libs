# Testing Guide

This document explains the testing setup and practices for the AI Mad Libs application.

## Overview

The project uses a comprehensive testing strategy with different frameworks for different parts of the application:

- **Frontend (React)**: Jest + React Testing Library
- **Backend (Lambda)**: Jest + TypeScript
- **Integration**: Manual testing with AWS services

## Project Structure

```
├── src/                          # Frontend source
│   └── __tests__/               # Frontend tests
│       ├── components/          # Component tests
│       └── utils/              # Utility function tests
├── lambda/                      # Backend Lambda functions
│   └── src/
│       └── __tests__/          # Lambda tests
│           ├── handlers/       # API handler tests
│           └── services/       # Service layer tests
└── docs/                       # Documentation
```

## Frontend Testing

### Setup
- **Framework**: Jest with React Testing Library
- **Configuration**: `jest.config.js` in project root
- **Test Files**: `*.test.tsx` and `*.test.ts` in `src/__tests__/`

### Running Frontend Tests
```bash
npm test                    # Run all tests in watch mode
npm run test:ci            # Run tests once (CI mode)
npm run test:coverage      # Run with coverage report
```

### Frontend Test Examples

#### Component Testing
```typescript
// src/__tests__/components/ThemeSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeSelector } from '../../components/ThemeSelector';

describe('ThemeSelector', () => {
  it('should render theme options', () => {
    render(<ThemeSelector onThemeSelect={jest.fn()} />);
    expect(screen.getByText('Adventure')).toBeInTheDocument();
  });
});
```

#### Utility Testing
```typescript
// src/__tests__/utils/gameHelpers.test.ts
import { generateRoomCode } from '../../utils/gameHelpers';

describe('gameHelpers', () => {
  it('should generate valid room codes', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[A-Z]{4}$/);
  });
});
```

## Backend Testing (Lambda)

### Setup
- **Framework**: Jest with TypeScript
- **Configuration**: `lambda/jest.config.js`
- **Test Files**: `*.test.ts` in `lambda/src/__tests__/`

### Running Lambda Tests
```bash
cd lambda
npm test                    # Run all Lambda tests
npm run test:watch         # Run in watch mode
npm run test:coverage      # Run with coverage
```

### Lambda Test Structure

#### Service Layer Tests
```typescript
// lambda/src/__tests__/services/StoryGenerator.test.ts
import { StoryGenerator } from '../../services/StoryGenerator';

describe('StoryGenerator', () => {
  let storyGenerator: StoryGenerator;

  beforeEach(() => {
    StoryGenerator.resetInstance();
    storyGenerator = StoryGenerator.getInstance();
  });

  it('should generate story templates', async () => {
    const result = await storyGenerator.generateTemplate('adventure', 4);
    expect(result).toHaveProperty('title');
    expect(result.paragraphs.length).toBeGreaterThan(0);
  });
});
```

#### Handler Tests
```typescript
// lambda/src/__tests__/handlers/story-generation.test.ts
import { handler } from '../../story-generation';

describe('story-generation handler', () => {
  it('should handle valid requests', async () => {
    const event = createMockEvent({ playerCount: 3 });
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveProperty('template');
  });
});
```

## Mocking Strategy

### AWS Services
We mock AWS SDK clients to avoid actual API calls during testing:

```typescript
// Mock AWS Bedrock
jest.mock('@aws-sdk/client-bedrock-runtime');
const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockSend = jest.fn();
mockBedrockClient.prototype.send = mockSend;

// Mock successful response
mockSend.mockResolvedValue({
  body: new TextEncoder().encode(JSON.stringify({
    images: [Buffer.from('fake-image-data').toString('base64')]
  }))
});
```

### External APIs
We mock fetch for external HTTP calls:

```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(1024))
});
```

## Test Configuration Files

### Frontend Jest Config
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### Lambda Jest Config
```javascript
// lambda/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Lambda Jest Setup
```javascript
// lambda/jest.setup.js
process.env.CLOUDFRONT_DOMAIN = 'test-cloudfront-domain.cloudfront.net';
process.env.S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';
jest.setTimeout(30000);
```

## Testing Best Practices

### 1. Test Structure
- Use `describe` blocks to group related tests
- Use `beforeEach` for setup that applies to multiple tests
- Use clear, descriptive test names

### 2. Mocking
- Mock external dependencies (AWS, HTTP calls)
- Reset mocks between tests using `jest.clearAllMocks()`
- Mock at the module level for consistency

### 3. Assertions
- Test both success and error cases
- Verify expected properties exist
- Check that mocked functions are called correctly

### 4. Async Testing
- Use `async/await` for asynchronous operations
- Test error handling with `expect().rejects.toThrow()`

## Common Testing Patterns

### Singleton Pattern Testing
```typescript
beforeEach(() => {
  ServiceClass.resetInstance(); // Reset singleton
  service = ServiceClass.getInstance();
});
```

### Error Handling Testing
```typescript
it('should handle API errors', async () => {
  mockSend.mockRejectedValue(new Error('API Error'));
  
  await expect(
    service.someMethod()
  ).rejects.toThrow('API Error');
});
```

### Mock Response Testing
```typescript
it('should process successful responses', async () => {
  mockSend.mockResolvedValue(mockSuccessResponse);
  
  const result = await service.someMethod();
  
  expect(result).toHaveProperty('expectedProperty');
  expect(mockSend).toHaveBeenCalledWith(expect.any(SomeCommand));
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### CI Commands
```bash
# Frontend tests
npm ci
npm run test:ci

# Lambda tests
cd lambda
npm ci
npm test
```

## Coverage Reports

Coverage reports are generated for both frontend and backend:
- **Frontend**: `coverage/` directory
- **Lambda**: `lambda/coverage/` directory

Target coverage: 80% or higher for critical paths.

## Troubleshooting

### Common Issues

1. **Import Path Errors**
   - Check relative paths in test files
   - Ensure `moduleNameMapper` is configured correctly

2. **Mock Not Working**
   - Verify mock is declared before imports
   - Check that mock setup is in `beforeEach`

3. **Async Test Timeouts**
   - Increase timeout with `jest.setTimeout()`
   - Ensure promises are properly awaited

4. **TypeScript Errors**
   - Add Jest types to `tsconfig.json`
   - Import proper type definitions

### Debug Commands
```bash
# Run specific test file
npm test -- ThemeSelector.test.tsx

# Run tests with verbose output
npm test -- --verbose

# Run tests without cache
npm test -- --no-cache
```

## Future Improvements

- Add E2E testing with Playwright or Cypress
- Implement visual regression testing
- Add performance testing for Lambda functions
- Set up automated accessibility testing