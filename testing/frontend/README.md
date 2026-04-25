# Frontend Testing

This directory contains test templates and examples for the Restmage frontend (React/TypeScript).

## Structure

```
frontend/
├── components/      # Component tests using React Testing Library
│   ├── Dashboard.test.tsx
│   └── FloorPlanGenerator.test.tsx
├── services/        # Service/API tests
│   ├── api.test.ts
│   └── geminiFloorPlan.test.ts
└── README.md        # This file
```

## Testing Stack

- **Test Runner**: Jest (via Create React App)
- **Testing Library**: React Testing Library (@testing-library/react)
- **User Interactions**: @testing-library/user-event
- **Assertions**: Jest matchers + @testing-library/jest-dom

## Running Tests

### All Frontend Tests
```bash
# From root directory
npm run test:client

# From client directory
cd client
npm test
```

### Watch Mode (Interactive)
```bash
cd client
npm test
```

### Coverage Report
```bash
cd client
npm test -- --coverage --watchAll=false
```

### Specific Test File
```bash
cd client
npm test Dashboard.test
```

## Writing Tests

### Component Tests

**Key Principles:**
1. Test user behavior, not implementation
2. Use semantic queries (getByRole, getByLabelText)
3. Mock external dependencies (API, contexts)
4. Test loading, error, and success states
5. Use userEvent for realistic interactions

**Example:**
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('user can submit form', async () => {
  const user = userEvent.setup();
  render(<MyForm />);
  
  await user.type(screen.getByLabelText(/name/i), 'John');
  await user.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

### Service Tests

**Key Principles:**
1. Mock axios/HTTP clients
2. Test success and error paths
3. Verify correct parameters
4. Test authentication handling
5. Test error handling for different status codes

**Example:**
```typescript
import * as api from '../services/api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

test('fetches projects successfully', async () => {
  mockedApi.get.mockResolvedValueOnce({ data: { projects: [] } });
  
  const result = await fetchProjects();
  
  expect(mockedApi.get).toHaveBeenCalledWith('/projects');
  expect(result).toEqual({ projects: [] });
});
```

## Test Patterns

### 1. Rendering with Providers

Components often need context providers:

```typescript
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};
```

### 2. Async Operations

Always use `waitFor` for async operations:

```typescript
await waitFor(() => {
  expect(screen.getByText(/loaded/i)).toBeInTheDocument();
});
```

### 3. User Interactions

Use `userEvent` instead of `fireEvent`:

```typescript
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
```

### 4. Mocking Modules

Mock entire modules at the top of test files:

```typescript
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn()
}));
```

### 5. Cleanup

Always clean mocks between tests:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Query Priorities (Testing Library)

Use queries in this order (most to least preferred):

1. **getByRole** - Most accessible
2. **getByLabelText** - Form fields
3. **getByPlaceholderText** - If no label
4. **getByText** - Non-interactive elements
5. **getByDisplayValue** - Form elements with values
6. **getByAltText** - Images
7. **getByTitle** - If no better option
8. **getByTestId** - Last resort only

## Common Matchers

```typescript
// Jest matchers
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(array).toContain(item);
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);

// jest-dom matchers
expect(element).toBeInTheDocument();
expect(element).toBeVisible();
expect(element).toBeDisabled();
expect(element).toHaveTextContent('text');
expect(element).toHaveAttribute('attr', 'value');
```

## Best Practices

### ✅ DO
- Test user-visible behavior
- Use semantic HTML and ARIA roles
- Test accessibility
- Mock external dependencies
- Test loading and error states
- Use descriptive test names
- Keep tests focused and independent

### ❌ DON'T
- Test implementation details
- Use `.instance()` or access state directly
- Rely on snapshots for everything
- Test library code
- Make tests dependent on each other
- Use arbitrary delays (`setTimeout`)
- Hardcode test data without context

## Debugging Tests

### View DOM Structure
```typescript
import { screen } from '@testing-library/react';

screen.debug(); // Prints current DOM
screen.debug(element); // Prints specific element
```

### Use logRoles
```typescript
import { logRoles } from '@testing-library/react';

const { container } = render(<MyComponent />);
logRoles(container); // Shows all accessible roles
```

### VS Code Debugging
1. Set breakpoint in test file
2. Run: "Jest: Debug Test" command
3. Or use launch.json configuration

## Common Issues

### 1. "Unable to find element"
- Element might not be rendered yet (use `waitFor`)
- Wrong query (check with `screen.debug()`)
- Element is not accessible (add proper ARIA)

### 2. "Cannot perform updates on unmounted component"
- Mock cleanup needed
- Use `cleanup()` or wrap in `act()`

### 3. "Not wrapped in act(...)"
- Async state update not awaited
- Use `waitFor` or `findBy` queries

## Resources

- [React Testing Library Docs](https://testing-library.com/react)
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Common Testing Patterns](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Accessible Queries](https://testing-library.com/docs/queries/about#priority)

## TODO

- [ ] Add test coverage for all components
- [ ] Create tests for custom hooks
- [ ] Add integration tests for user flows
- [ ] Set up E2E tests with Cypress/Playwright
- [ ] Add visual regression testing
- [ ] Implement accessibility testing (axe-core)
