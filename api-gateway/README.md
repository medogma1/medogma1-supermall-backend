# API Gateway

## Overview
The API Gateway serves as the entry point for all client requests to the SuperMall backend services. It handles routing, authentication, and cross-origin resource sharing (CORS) configuration.

## CORS Configuration

The API Gateway implements a flexible CORS configuration that allows you to control which origins can access your API. This is important for security and to prevent unauthorized access to your API.

### Default Configuration

By default, the API Gateway allows requests from:

1. Local development environments (`localhost` and `127.0.0.1` with any port)
2. Origins specified in the `config.js` file
3. The frontend URL specified in the main configuration
4. Additional origins specified in the environment variable `CORS_ALLOWED_ORIGINS`

### How to Configure CORS

#### Method 1: Using Environment Variables

Add the following to your `.env` file:

```
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

Multiple origins should be separated by commas.

#### Method 2: Updating the Configuration File

Edit the `api-gateway/config/config.js` file to add allowed origins:

```javascript
module.exports = {
  // ... other config
  cors: {
    origin: [
      'http://localhost:3000',
      'https://yourdomain.com',
      // Add more origins here
    ],
    credentials: true
  },
  // ... other config
};
```

### Debugging CORS Issues

If you encounter CORS errors, the API Gateway logs detailed information to help you debug:

1. Check the console for messages starting with `❌ CORS rejected origin:` to see which origins are being rejected
2. Detailed CORS error information is logged with the prefix `🔴 CORS Error Details:`
3. On startup, the API Gateway logs all configured origins with the prefix `🔒 CORS configured with the following origins:`

#### CORS Test Endpoint

The API Gateway provides a test endpoint to verify your CORS configuration:

```
GET /cors-test
```

If your CORS configuration is correct, you'll receive a JSON response with a success message. This endpoint can be used to test if your frontend application can successfully make requests to the API Gateway.

#### CORS Test Tool

A browser-based CORS testing tool is included in the project. To use it:

1. Open the file `api-gateway/cors-test.html` in your browser
2. Enter your API Gateway URL (default: http://localhost:5001)
3. Click "Test CORS Configuration"

This tool will show you if CORS is properly configured for the browser's origin. It's particularly useful for testing frontend applications running on different domains or ports.

### Security Considerations

- Only add trusted domains to your CORS configuration
- For production, avoid using wildcard origins (`*`)
- Consider using environment-specific configurations for development, staging, and production

## API Routes

The API Gateway routes requests to the appropriate microservices based on the URL path. See the main documentation for details on available endpoints.