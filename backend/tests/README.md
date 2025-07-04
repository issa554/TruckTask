# Backend Testing Setup

This directory contains comprehensive unit and integration tests for the Truck Utilization Calculator backend using Jest and Supertest.

## Testing Architecture

### Test Database
- **MongoDB Memory Server**: Uses an in-memory MongoDB instance for testing
- **Isolated Environment**: Each test run uses a fresh database
- **Automatic Cleanup**: Database is cleared after each test

### Test Structure

```
tests/
├── setup.js                           # Test configuration and database setup
├── utils/
│   └── testHelpers.js                 # Test utilities and mock data
├── services/
│   ├── calculationService.test.js     # Unit tests for calculation service
│   └── calculationService.utilities.test.js  # Tests for utility functions
├── integration/
│   └── calculationAPI.test.js         # Integration tests for API endpoints
└── README.md                          # This file
```

## Test Categories

### 1. Unit Tests (`tests/services/`)
- **calculationService.test.js**: Tests for main service functions
  - `getTruckingCalculationDetails()`
  - `createCalculationService()`
  - `updateCalculationService()`
  - Error handling and edge cases

- **calculationService.utilities.test.js**: Tests for utility functions
  - `createSpace()`
  - `canFit()`
  - `splitSpace()`
  - `calculateEnd()`

### 2. Integration Tests (`tests/integration/`)
- **calculationAPI.test.js**: End-to-end API tests using Supertest
  - `POST /api/calculations/calculate`
  - `POST /api/calculations`
  - `GET /api/calculations`
  - `GET /api/calculations/search`
  - `PUT /api/calculations/:id`

### 3. Test Utilities (`tests/utils/`)
- **testHelpers.js**: Common utilities and mock data
  - Mock SKU and TruckType data
  - Helper functions for creating test data
  - Validation functions for test assertions

## Running Tests

### Prerequisites
Make sure you have all dependencies installed:
```bash
npm install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit

# Run tests with verbose output
npm run test:verbose
```

### Coverage Reports
Coverage reports are generated in the `coverage/` directory and include:
- HTML report: `coverage/lcov-report/index.html`
- LCOV report: `coverage/lcov.info`
- Text summary in terminal

## Test Data

### Mock SKUs
```javascript
const mockSKUs = [
  { name: 'Small Box', length: 10, width: 10, height: 10, weight: 5 },
  { name: 'Medium Box', length: 20, width: 20, height: 20, weight: 15 },
  { name: 'Large Box', length: 30, width: 30, height: 30, weight: 25 },
  { name: 'Heavy Small Box', length: 10, width: 10, height: 10, weight: 50 }
];
```

### Mock Truck Types
```javascript
const mockTruckTypes = [
  { name: 'Small Truck', length: 100, width: 50, height: 50, weightCapacity: 1000 },
  { name: 'Medium Truck', length: 200, width: 100, height: 100, weightCapacity: 5000 },
  { name: 'Large Truck', length: 400, width: 200, height: 200, weightCapacity: 10000 }
];
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Test Environment**: Node.js
- **Test Match**: `**/tests/**/*.test.js`
- **Setup Files**: `tests/setup.js`
- **Timeout**: 30 seconds for async operations
- **Coverage**: Excludes server.js and seed.js

### Setup File (`tests/setup.js`)
- Configures MongoDB Memory Server
- Handles database connection and cleanup
- Sets test environment variables

## Writing New Tests

### Service Tests
```javascript
describe('YourService', () => {
  let testData;

  beforeEach(async () => {
    testData = await createTestData();
  });

  test('should perform expected behavior', async () => {
    const result = await yourServiceFunction(testData);
    expect(result).toMatchExpectedStructure();
  });
});
```

### API Tests
```javascript
describe('Your API Endpoint', () => {
  test('should return expected response', async () => {
    const response = await request(app)
      .post('/api/your-endpoint')
      .send(requestData)
      .expect(200);

    expect(response.body).toHaveProperty('expectedField');
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use `beforeEach` and `afterEach` hooks for setup and cleanup
3. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
4. **Test Structure**: Follow Arrange-Act-Assert pattern
5. **Edge Cases**: Test both happy paths and error conditions
6. **Coverage**: Aim for high test coverage while focusing on meaningful tests

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Ensure MongoDB Memory Server is installed: `npm install --save-dev mongodb-memory-server`
   - Check that no other MongoDB instances are conflicting

2. **Timeout Errors**
   - Increase Jest timeout in configuration if tests involve large data processing
   - Ensure async operations are properly awaited

3. **Test Isolation Issues**
   - Verify database cleanup is working in `afterEach` hooks
   - Check for global state that might leak between tests

### Debug Mode
Run tests with debugging:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Dependencies

### Testing Dependencies
- **jest**: Test framework
- **supertest**: HTTP assertion library
- **mongodb-memory-server**: In-memory MongoDB for testing
- **chai**: Assertion library (included but not required)
- **sinon**: Stubbing and mocking library (included but not required)

### Production Dependencies Used in Tests
- **mongoose**: MongoDB ODM
- **express**: Web framework
- **cors**: CORS middleware

## Performance Considerations

- Tests use in-memory database for speed
- Parallel test execution is enabled by default
- Large dataset tests are isolated to prevent memory issues
- Test data is kept minimal but representative

## Continuous Integration

This test suite is designed to work in CI/CD environments:
- No external dependencies required
- Fast execution with in-memory database
- Comprehensive coverage reporting
- Clear exit codes for automation 