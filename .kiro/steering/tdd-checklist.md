---
inclusion: always
---

# TDD Checklist - Mandatory for Every Development Task

## 🚨 CRITICAL: No Code Without Tests First

**This checklist MUST be completed for every feature, bug fix, or refactoring task.**

## Pre-Development Phase

### Requirements Analysis
- [ ] **Requirement understood completely**
  - What is the expected input?
  - What is the expected output?
  - What are the success criteria?

- [ ] **Test scenarios identified**
  - Happy path scenarios
  - Error/exception scenarios  
  - Edge cases and boundary conditions
  - Integration points with other components

- [ ] **Test location determined**
  - Frontend: `src/__tests__/components/` or `src/__tests__/utils/`
  - Lambda: `lambda/src/__tests__/services/` or `lambda/src/__tests__/handlers/`

## TDD Cycle 1: Basic Functionality

### RED Phase - Write Failing Test
- [ ] **Test file created** (if new feature)
- [ ] **Test describes expected behavior clearly**
- [ ] **Test uses proper naming convention**
  - `describe('ComponentName')` or `describe('ServiceName')`
  - `it('should do something specific')`

- [ ] **Test follows AAA pattern**
  - **Arrange**: Set up test data and mocks
  - **Act**: Execute the function/method under test
  - **Assert**: Verify the expected outcome

- [ ] **Test runs and FAILS for the right reason**
  ```bash
  npm test -- FeatureName.test.ts
  # Should show: "Cannot find module" or "function not defined"
  ```

### GREEN Phase - Make Test Pass
- [ ] **Minimal implementation created**
  - Just enough code to make the test pass
  - Hardcoded values are acceptable at this stage

- [ ] **Test now PASSES**
  ```bash
  npm test -- FeatureName.test.ts
  # Should show: "1 passing"
  ```

- [ ] **No other tests broken**
  ```bash
  npm test
  # All existing tests should still pass
  ```

## TDD Cycle 2: Error Handling

### RED Phase - Test Error Scenarios
- [ ] **Error handling tests added**
  ```typescript
  it('should throw error for invalid input', () => {
    expect(() => functionUnderTest(null)).toThrow('Input is required');
  });
  ```

- [ ] **Tests fail initially**

### GREEN Phase - Implement Error Handling
- [ ] **Error handling implemented**
- [ ] **All error tests pass**
- [ ] **Original functionality still works**

## TDD Cycle 3: Edge Cases

### RED Phase - Test Edge Cases
- [ ] **Boundary condition tests added**
  - Empty strings, null values, undefined
  - Maximum/minimum values
  - Array boundaries (empty, single item, large arrays)

- [ ] **Integration point tests added**
  - Mock external dependencies
  - Test service interactions

### GREEN Phase - Handle Edge Cases
- [ ] **Edge case handling implemented**
- [ ] **All edge case tests pass**
- [ ] **Core functionality unchanged**

## Refactoring Phase

### Code Quality Improvements
- [ ] **Code refactored for readability**
  - Extract functions if needed
  - Improve variable names
  - Add comments for complex logic

- [ ] **All tests still pass after refactoring**
- [ ] **No new functionality added during refactoring**

## Mock and Setup Verification

### External Dependencies
- [ ] **AWS services mocked properly**
  ```typescript
  jest.mock('@aws-sdk/client-bedrock-runtime');
  const mockSend = jest.fn();
  ```

- [ ] **HTTP calls mocked**
  ```typescript
  global.fetch = jest.fn().mockResolvedValue(mockResponse);
  ```

- [ ] **Environment variables set in tests**
  ```typescript
  process.env.TEST_VAR = 'test-value';
  ```

### Test Isolation
- [ ] **Tests don't depend on each other**
- [ ] **Mocks reset between tests**
  ```typescript
  beforeEach(() => {
    jest.clearAllMocks();
    ServiceClass.resetInstance();
  });
  ```

- [ ] **Tests can run in any order**

## Component-Specific Checklists

### React Component TDD
- [ ] **Component renders without crashing**
- [ ] **Props are handled correctly**
- [ ] **User interactions tested**
  ```typescript
  fireEvent.click(screen.getByRole('button'));
  expect(mockHandler).toHaveBeenCalled();
  ```
- [ ] **Conditional rendering tested**
- [ ] **Accessibility attributes present**

### Service Class TDD
- [ ] **Singleton pattern tested (if applicable)**
- [ ] **Public methods tested**
- [ ] **Error handling tested**
- [ ] **External service calls mocked**
- [ ] **Return values validated**

### API Handler TDD
- [ ] **Valid request handling tested**
- [ ] **Invalid request handling tested**
- [ ] **Error responses tested**
- [ ] **CORS headers included**
- [ ] **Status codes correct**

## Quality Gates

### Before Committing Code
- [ ] **All tests pass locally**
  ```bash
  npm test  # Frontend
  cd lambda && npm test  # Lambda
  ```

- [ ] **Test coverage adequate**
  - New code: 90%+ coverage
  - Critical paths: 100% coverage

- [ ] **No console.log or debug code left**
- [ ] **Code follows project conventions**

### Test Quality Verification
- [ ] **Tests are readable and maintainable**
- [ ] **Test names clearly describe behavior**
- [ ] **Tests focus on behavior, not implementation**
- [ ] **No duplicate test logic**
- [ ] **Proper use of test utilities and helpers**

## Common TDD Mistakes to Avoid

### ❌ Anti-Patterns
- [ ] **NOT writing implementation before tests**
- [ ] **NOT skipping the failing test verification**
- [ ] **NOT testing only happy paths**
- [ ] **NOT ignoring error scenarios**
- [ ] **NOT testing implementation details instead of behavior**

### ✅ Best Practices Followed
- [ ] **Tests written before any implementation**
- [ ] **Tests fail first, then pass**
- [ ] **Both success and failure paths tested**
- [ ] **Tests focus on public interface**
- [ ] **Mocks used for external dependencies**

## Documentation Updates

### When Adding New Features
- [ ] **README updated if public API changed**
- [ ] **Type definitions updated**
- [ ] **Examples added to documentation**

## Final Verification

### Complete TDD Cycle Confirmation
- [ ] **Started with failing test (RED)**
- [ ] **Made test pass with minimal code (GREEN)**
- [ ] **Refactored while keeping tests green**
- [ ] **Added comprehensive test coverage**
- [ ] **All tests pass consistently**

### Integration Verification
- [ ] **Feature works with existing codebase**
- [ ] **No regressions introduced**
- [ ] **Performance impact acceptable**

## Sign-off

**Only check this box when ALL above items are completed:**

- [ ] **TDD process completed successfully for this task**

---

## Quick Reference Commands

```bash
# Start TDD cycle
npm test -- --watch NewFeature.test.ts

# Verify all tests pass
npm test

# Check coverage
npm run test:coverage

# Debug specific test
npm test -- --verbose --testNamePattern="specific test"
```

**Remember: This checklist is mandatory. No exceptions. No shortcuts.**