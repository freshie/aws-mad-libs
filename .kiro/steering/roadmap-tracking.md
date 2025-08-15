---
inclusion: always
---

# Roadmap Tracking Guidelines for Kiro

## Automatic Roadmap Maintenance

**ALWAYS update the ROADMAP.md file when completing development tasks.**

## When to Update the Roadmap

### ✅ Mark as Complete When:
1. **Feature is fully implemented and tested**
2. **All tests pass**
3. **Code is deployed/merged**
4. **Documentation is updated**

### 📝 Update Progress When:
1. **Starting work on a roadmap item**
2. **Completing sub-tasks within a larger item**
3. **Encountering blockers or delays**
4. **Changing scope or approach**

## Roadmap Update Process

### Step 1: Identify Roadmap Item
Before starting any work, check if the task relates to a roadmap item:
```bash
# Search for related roadmap items
grep -i "keyword" ROADMAP.md
```

### Step 2: Update Status
Use these status indicators:
- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked/Issues

### Step 3: Add Completion Details
When marking items complete, add:
- ✅ **COMPLETED** marker
- Date completed
- Brief description of what was accomplished
- Links to relevant files/documentation

## Roadmap Update Examples

### Completing a Major Feature
```markdown
- [x] **Re-implement Test Suite** ✅ **COMPLETED - Jan 27, 2025**
  - [x] Rebuild tests lost during v1 → v2 serverless migration
  - [x] Add Lambda function unit tests (StoryGenerator, ImageGenerator, VideoGenerator)
  - [x] Add API handler unit tests (story-generation)
  - [x] Setup comprehensive Jest configuration
  - [x] Implement TDD workflow and documentation
  - [ ] Implement API integration tests
  - [ ] Add end-to-end testing with Playwright
```

### Starting Work on an Item
```markdown
- [~] **Fix Video Creation Issue** 🚧 **IN PROGRESS - Started Jan 27, 2025**
  - [x] Debug Nova Reel integration failures
  - [~] Implement fallback video generation using MediaConvert
  - [ ] Add proper error handling and user feedback
  - [ ] Test video generation with different story lengths
```

### Encountering Blockers
```markdown
- [!] **Setup AWS WAF** ⚠️ **BLOCKED - Jan 27, 2025**
  - [!] Configure Web Application Firewall for CloudFront (Waiting for AWS permissions)
  - [ ] Add rate limiting and DDoS protection
  - [ ] Implement geo-blocking if needed
  - [ ] Monitor and alert on security events
```

## Automatic Roadmap Updates

### After Completing TDD Tasks
When following TDD workflow, automatically check if the completed feature relates to roadmap items:

1. **Search roadmap for related keywords**
2. **Update status if match found**
3. **Add completion details**
4. **Update phase progress if applicable**

### Phase Progress Tracking
Update phase completion percentages:
```markdown
### Phase 1: Core Fixes & Security (v2.4.0) - 35% Complete
**Target: Q1 2025**
```

Calculate based on completed vs total items in the phase.

## Roadmap Maintenance Commands

### Search for Related Items
```bash
# Find roadmap items related to current work
grep -i -A 5 -B 5 "test\|unit\|jest" ROADMAP.md
```

### Update Completion Status
```bash
# Use sed to update status (example)
sed -i 's/\[ \] \*\*Re-implement Test Suite\*\*/[x] **Re-implement Test Suite** ✅ **COMPLETED**/' ROADMAP.md
```

## Integration with Development Workflow

### Before Starting Work
1. Check ROADMAP.md for related items
2. Update status to "In Progress" if found
3. Note start date and approach

### During Development
1. Update sub-task progress as items are completed
2. Note any scope changes or blockers
3. Add relevant file references

### After Completing Work
1. Mark items as complete with ✅ marker
2. Add completion date
3. Update phase progress percentage
4. Add links to relevant documentation

## Roadmap Review Schedule

### Weekly Reviews
- Update progress on all in-progress items
- Identify blockers and dependencies
- Adjust timelines if needed

### Monthly Reviews
- Review phase completion percentages
- Update target dates if needed
- Add new items discovered during development

### Quarterly Reviews
- Major roadmap restructuring if needed
- Update success metrics and targets
- Plan next quarter's priorities

## Success Metrics Tracking

### Automatically Track:
- Test coverage percentages
- Feature completion rates
- Bug fix completion times
- Performance improvements

### Update Metrics When:
- Completing major features
- Reaching phase milestones
- Monthly reviews

## Example Roadmap Update Workflow

```markdown
## Current Task: Implementing User Authentication

### Before Starting:
- [~] **AWS Cognito Integration** 🚧 **IN PROGRESS - Jan 27, 2025**
  - [ ] User registration and login
  - [ ] Social login (Google, Facebook, Apple)
  - [ ] Email verification and password reset
  - [ ] User profile management

### After Completing User Registration:
- [~] **AWS Cognito Integration** 🚧 **IN PROGRESS - Jan 27, 2025**
  - [x] User registration and login ✅ **COMPLETED - Jan 28, 2025**
  - [ ] Social login (Google, Facebook, Apple)
  - [ ] Email verification and password reset
  - [ ] User profile management

### After Completing All Sub-tasks:
- [x] **AWS Cognito Integration** ✅ **COMPLETED - Feb 5, 2025**
  - [x] User registration and login
  - [x] Social login (Google, Facebook, Apple)
  - [x] Email verification and password reset
  - [x] User profile management
  - **Files**: `src/auth/`, `lambda/src/auth/`, `docs/AUTHENTICATION.md`
  - **Tests**: 95% coverage, all integration tests passing
```

## Remember: Keep Roadmap Current

The roadmap is a living document that should always reflect:
- ✅ Current project status
- 🎯 Accurate completion percentages
- 📅 Realistic timelines
- 🚧 Active work in progress
- ⚠️ Known blockers and issues

**Update it with every significant development milestone!**