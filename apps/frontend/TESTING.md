# Testing Guide for Zenith Frontend

This document provides comprehensive information about the testing setup and how to run tests for the Zenith dating application frontend.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [Mocking](#mocking)
- [CI/CD Integration](#cicd-integration)

## Overview

The Zenith frontend application uses a comprehensive testing strategy with three types of tests:

1. **Unit Tests** - Test individual components and functions in isolation
2. **Integration Tests** - Test how multiple components work together
3. **E2E Tests** - Test complete user flows from start to finish

### Technologies Used

- **Vitest** - Fast unit test framework with native ESM support
- **Playwright** - End-to-end testing framework
- **React Testing Library** - Component testing utilities
- **Testing Library Jest DOM** - Custom matchers for DOM assertions

## Test Structure

```
apps/frontend/
├── src/
│   ├── test/
│   │   ├── setup.ts              # Vitest setup and global mocks
│   │   ├── utils.tsx             # Testing utilities and helpers
│   │   ├── integration/          # Integration tests
│   │   │   ├── auth.test.tsx
│   │   │   ├── payment.test.tsx
│   │   │   └── realtime.test.ts
│   │   └── mocks/                # Mock implementations
│   │       ├── supabase.ts
│   │       └── stripe.ts
│   ├── lib/
│   │   ├── utils.test.ts         # Unit tests for utils
│   │   ├── validation.test.ts    # Unit tests for validation
│   │   └── supabase.test.ts      # Unit tests for Supabase helpers
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthFlow.test.tsx
│   │   ├── profile/
│   │   │   └── ProfileCard.test.tsx
│   │   └── subscription/
│   │       └── SubscriptionDialog.test.tsx
│   └── contexts/
│       └── AuthContext.test.tsx
├── e2e/
│   ├── auth.spec.ts              # E2E auth tests
│   ├── profile.spec.ts           # E2E profile tests
│   ├── messaging.spec.ts         # E2E messaging tests
│   └── subscription.spec.ts      # E2E subscription tests
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Coverage

The test suite aims for **85%+ coverage** across:

- Lines
- Functions
- Branches
- Statements

### Coverage Exclusions

The following are excluded from coverage:
- UI components from shadcn/ui (`src/components/ui/**`)
- Mock data files
- Configuration files
- Type definition files
- Test files themselves

### Viewing Coverage Reports

After running `npm run test:coverage`, open:
- HTML Report: `coverage/index.html`
- Terminal output will show summary

## Writing Tests

### Unit Tests

Unit tests should test individual functions or components in isolation.

```typescript
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2')
    expect(result).toBe('class1 class2')
  })
})
```

### Component Tests

Component tests use React Testing Library for rendering and assertions.

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils'
import MyComponent from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    render(<MyComponent />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    // assertions...
  })
})
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/utils'

describe('Authentication Flow', () => {
  it('should complete sign in process', async () => {
    render(<AuthFlow />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled()
    })
  })
})
```

### E2E Tests

E2E tests use Playwright to test complete user workflows.

```typescript
import { test, expect } from '@playwright/test'

test.describe('User Registration', () => {
  test('should register new user', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Sign Up').click()
    await page.getByLabel('Email').fill('test@example.com')
    await page.getByLabel('Password').fill('password123')
    await page.getByRole('button', { name: /create account/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
  })
})
```

## Mocking

### Supabase

The Supabase client is fully mocked in `/src/test/mocks/supabase.ts`:

```typescript
import { mockSupabaseClient } from '@/test/mocks/supabase'

// Customize mock behavior in tests
mockSupabaseClient.auth.signIn.mockResolvedValue({
  data: { user: mockUser },
  error: null,
})
```

### Stripe

Stripe is mocked in `/src/test/mocks/stripe.ts`:

```typescript
import { mockStripe, mockLoadStripe } from '@/test/mocks/stripe'

// Customize Stripe behavior
mockLoadStripe.mockResolvedValue(mockStripe)
mockStripe.redirectToCheckout.mockResolvedValue({ error: null })
```

### Other Mocks

Global mocks are set up in `/src/test/setup.ts`:
- `window.matchMedia`
- `IntersectionObserver`
- `ResizeObserver`
- `localStorage`
- `sessionStorage`
- `fetch`
- `next/navigation`
- `framer-motion`

## Test Organization

### Naming Conventions

- Test files: `*.test.ts` or `*.test.tsx` for unit/integration tests
- E2E test files: `*.spec.ts`
- Test descriptions: Use descriptive names starting with "should"

### Best Practices

1. **Arrange, Act, Assert** - Structure tests with clear setup, execution, and verification
2. **One assertion per test** - Keep tests focused (when possible)
3. **Use data-testid sparingly** - Prefer accessible queries (role, label, text)
4. **Mock external dependencies** - Keep tests fast and deterministic
5. **Test user behavior** - Focus on what users do, not implementation details
6. **Keep tests independent** - Each test should work in isolation
7. **Use beforeEach for setup** - Clean setup before each test

## Coverage Goals by Category

### Unit Tests (Target: 90%+)
- ✅ Utility functions (utils.ts, validation.ts)
- ✅ Supabase helpers
- ✅ Validation schemas
- ✅ Type guards and helpers

### Component Tests (Target: 85%+)
- ✅ AuthFlow component
- ✅ ProfileCard component
- ✅ SubscriptionDialog component
- ✅ AuthContext provider

### Integration Tests (Target: 80%+)
- ✅ Complete authentication flows
- ✅ Payment integration
- ✅ Real-time messaging
- ✅ Profile interactions

### E2E Tests (Target: Critical Paths)
- ✅ User registration and login
- ✅ Profile viewing and interaction
- ✅ Messaging workflows
- ✅ Subscription purchase

## CI/CD Integration

### GitHub Actions Example

```yaml
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

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npx playwright install --with-deps && npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

**Issue: Tests timeout**
- Increase timeout in test or config
- Check for unresolved promises
- Ensure mocks are properly set up

**Issue: Module not found**
- Check path aliases in `vitest.config.ts`
- Ensure all imports use correct paths
- Run `npm install` to update dependencies

**Issue: Playwright browser not found**
- Run `npx playwright install`
- Check Playwright version compatibility

**Issue: Coverage not meeting threshold**
- Run `npm run test:coverage` to see uncovered lines
- Add tests for uncovered code
- Update exclusions if needed

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Summary

This comprehensive test suite provides:
- **32+ unit tests** covering utilities, validation, and helpers
- **40+ component tests** for React components
- **30+ integration tests** for complete flows
- **60+ E2E tests** for critical user journeys
- **85%+ code coverage** across the application

Run `npm run test:coverage` to verify current coverage and identify any gaps.
