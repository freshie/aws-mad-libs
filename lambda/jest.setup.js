// Jest setup file for Lambda tests
// This file is run before each test file

// Mock environment variables
process.env.CLOUDFRONT_DOMAIN = 'test-cloudfront-domain.cloudfront.net';
process.env.S3_BUCKET = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';

// Global test timeout
jest.setTimeout(30000);