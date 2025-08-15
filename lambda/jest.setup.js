// Mock AWS SDK for Lambda tests
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  InvokeModelCommand: jest.fn(),
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.AWS_REGION = 'us-east-1'
process.env.TABLE_NAME = 'test-table'
process.env.IMAGES_BUCKET_NAME = 'test-images-bucket'
process.env.CLOUDFRONT_DOMAIN = 'test-cloudfront-domain.cloudfront.net'