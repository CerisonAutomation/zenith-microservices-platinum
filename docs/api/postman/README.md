# Postman Collections

This directory contains Postman collections for all Zenith microservices.

## Quick Start

### Import All Collections

1. Open Postman
2. Click "Import" button
3. Drag and drop all `.json` files from this directory
4. Import the environment file: `zenith-environment.json`

### Set Up Environment

1. Click on "Environments" in Postman
2. Select "Zenith Development"
3. Update the variables with your values:
   - `base_url`: Your API gateway URL (default: `http://localhost:8080`)
   - `auth_service_url`: Auth service URL (default: `http://localhost:3001`)
   - `data_service_url`: Data service URL (default: `http://localhost:3003`)
   - `payment_service_url`: Payment service URL (default: `http://localhost:3002`)
   - `i18n_service_url`: i18n service URL (default: `http://localhost:3004`)
   - `user_service_url`: User service URL (default: `http://localhost:8000`)
   - `access_token`: Will be auto-populated after login

## Available Collections

### 1. Auth Service Collection
**File**: `auth-service.postman_collection.json`

Contains requests for:
- User registration
- Login
- Logout
- Token refresh
- Password reset
- OAuth flows
- Get current user

### 2. Data Service Collection
**File**: `data-service.postman_collection.json`

Contains requests for:
- User CRUD operations
- Subscription management
- Message handling
- Booking management

### 3. Payment Service Collection
**File**: `payment-service.postman_collection.json`

Contains requests for:
- Create checkout session
- Manage subscriptions
- Payment methods
- Webhook testing

### 4. i18n Service Collection
**File**: `i18n-service.postman_collection.json`

Contains requests for:
- Get translations
- List languages
- Batch translation
- Cache management

### 5. User Service Collection
**File**: `user-service.postman_collection.json`

Contains requests for all sub-services:
- Authentication & 2FA
- Chat
- Search
- Payment
- SMS
- Blog
- Forum
- Gallery
- Games
- Newsletter

### 6. API Gateway Collection
**File**: `api-gateway.postman_collection.json`

Contains requests for:
- Health checks
- Metrics
- Proxied service calls

## Auto-Generated Collections

You can regenerate collections from OpenAPI specs:

```bash
# Install openapi-to-postmanv2
npm install -g openapi-to-postmanv2

# Generate from Auth Service
openapi2postmanv2 \
  -s http://localhost:3001/openapi.json \
  -o auth-service.postman_collection.json \
  -p

# Generate from User Service
openapi2postmanv2 \
  -s http://localhost:8000/api/openapi.json \
  -o user-service.postman_collection.json \
  -p
```

## Using Collections

### Authentication Flow

1. **Run "Login" request** from Auth Service collection
2. The `access_token` will be automatically saved to environment
3. **All authenticated requests** will use this token automatically

### Pre-request Scripts

Collections include pre-request scripts to:
- Auto-inject authentication tokens
- Generate timestamps
- Create request IDs

### Tests

Collections include test scripts to:
- Validate response status codes
- Extract and save tokens
- Verify response structure

## Tips

### 1. Using Variables

Collections use environment variables:
```
{{auth_service_url}}/auth/login
{{access_token}}
```

### 2. Bulk Operations

You can run entire folders using the Collection Runner:
1. Right-click on a folder
2. Select "Run folder"
3. View results

### 3. Sharing Collections

Export and share with your team:
1. Right-click collection
2. Select "Export"
3. Share the JSON file

## Troubleshooting

### Token Expired

If you get 401 errors:
1. Run the "Login" request again
2. Or run "Refresh Token" request

### CORS Issues

If running from Postman web:
- Disable Postman interceptor
- Or use Postman desktop app

### Environment Not Selected

Make sure "Zenith Development" environment is selected in the top-right dropdown.
