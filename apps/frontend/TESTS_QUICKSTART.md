# Quick Start Guide - Running Tests

This guide will help you quickly get the test suite up and running.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation

```bash
# Navigate to frontend directory
cd apps/frontend

# Install dependencies (including new test dependencies)
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

## Running Tests

### 1. Unit & Integration Tests (Vitest)

```bash
# Run all unit and integration tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (auto-rerun on file changes)
npm run test:watch

# Run with interactive UI
npm run test:ui
```

### 2. E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI (recommended for debugging)
npm run test:e2e:ui

# Run in debug mode (step through tests)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run only on specific browser
npx playwright test --project=chromium
```

## Expected Results

### Unit & Integration Tests
```
✓ src/lib/utils.test.ts (6 tests)
✓ src/lib/validation.test.ts (32 tests)
✓ src/lib/supabase.test.ts (15 tests)
✓ src/components/auth/AuthFlow.test.tsx (15 tests)
✓ src/components/profile/ProfileCard.test.tsx (13 tests)
✓ src/components/subscription/SubscriptionDialog.test.tsx (17 tests)
✓ src/contexts/AuthContext.test.tsx (12 tests)
✓ src/test/integration/auth.test.tsx (12 tests)
✓ src/test/integration/payment.test.tsx (13 tests)
✓ src/test/integration/realtime.test.ts (15 tests)

Test Files  10 passed (10)
Tests  150+ passed (150+)
Coverage  87%+ (target: 85%)
```

### E2E Tests
```
Running 94 tests using 5 workers

✓ e2e/auth.spec.ts (21 tests)
✓ e2e/profile.spec.ts (23 tests)
✓ e2e/messaging.spec.ts (28 tests)
✓ e2e/subscription.spec.ts (22 tests)

94 passed
```

## Viewing Coverage Reports

After running `npm run test:coverage`:

```bash
# Open HTML coverage report in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows

# Or check terminal output for summary
```

Coverage report shows:
- Overall coverage percentage
- Line, branch, function, and statement coverage
- Uncovered lines highlighted
- File-by-file breakdown

## Common Commands

```bash
# Quick test during development
npm run test:watch

# Full test suite before commit
npm run test:coverage && npm run test:e2e

# Debug failing E2E test
npm run test:e2e:debug -- e2e/auth.spec.ts

# Run specific test file
npx vitest src/lib/validation.test.ts

# Run tests matching pattern
npx vitest --grep "sign up"
```

## Troubleshooting

### Issue: Module not found errors
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: Playwright browsers not installed
```bash
# Solution: Install Playwright browsers
npx playwright install --with-deps
```

### Issue: Tests timeout
```bash
# Solution: Increase timeout in test file or config
# Or run with longer timeout:
npm test -- --testTimeout=10000
```

### Issue: Port already in use (E2E tests)
```bash
# Solution: Kill process on port 3000
# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Test Development Workflow

1. **Write test first** (TDD approach)
   ```bash
   npm run test:watch
   # Create test file
   # Watch it fail
   ```

2. **Implement feature**
   ```bash
   # Write implementation
   # Watch test pass
   ```

3. **Check coverage**
   ```bash
   npm run test:coverage
   # Verify coverage meets threshold
   ```

4. **Run E2E tests**
   ```bash
   npm run test:e2e
   # Ensure integration works
   ```

## File Structure Quick Reference

```
apps/frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts              # Test setup
│   │   ├── utils.tsx             # Test utilities
│   │   ├── mocks/                # Mocks
│   │   └── integration/          # Integration tests
│   ├── lib/*.test.ts             # Unit tests
│   ├── components/*/*.test.tsx   # Component tests
│   └── contexts/*.test.tsx       # Context tests
├── e2e/
│   ├── auth.spec.ts
│   ├── profile.spec.ts
│   ├── messaging.spec.ts
│   └── subscription.spec.ts
├── vitest.config.ts
├── playwright.config.ts
└── TESTING.md                    # Full documentation
```

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Quick Tips

1. **Use watch mode** during development for instant feedback
2. **Run coverage** before committing to ensure threshold is met
3. **Use E2E UI mode** to debug failing E2E tests visually
4. **Check coverage report** to find untested code
5. **Run specific tests** while working on a feature
6. **Keep tests fast** by mocking external dependencies
7. **Test user behavior** not implementation details

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Run unit tests: `npm test`
3. ✅ Check coverage: `npm run test:coverage`
4. ✅ Install Playwright: `npx playwright install`
5. ✅ Run E2E tests: `npm run test:e2e`
6. ✅ Review coverage report: `open coverage/index.html`
7. ✅ Read full docs: `TESTING.md`

## Success Criteria

✅ All unit tests pass
✅ All integration tests pass
✅ All E2E tests pass
✅ Coverage ≥ 85%
✅ No failing tests in CI/CD

## Support

For detailed information, see:
- `TESTING.md` - Comprehensive testing guide
- `TEST_SUMMARY.md` - Summary of all tests created
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

**Ready to test?** Run `npm run test:coverage` to see the magic! ✨
