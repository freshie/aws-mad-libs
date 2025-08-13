// Test AWS connection
require('dotenv').config({ path: '.env.local' })

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime')
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3')

async function testAWSConnection() {
  console.log('Testing AWS connection...')
  
  // Check environment variables
  console.log('AWS_REGION:', process.env.AWS_REGION)
  console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set')
  console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set')
  console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME)
  
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('❌ AWS credentials not found in .env.local')
    return
  }
  
  try {
    // Test S3 connection
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
    
    const listCommand = new ListBucketsCommand({})
    const s3Response = await s3Client.send(listCommand)
    console.log('✅ S3 connection successful')
    console.log('Available buckets:', s3Response.Buckets?.map(b => b.Name))
    
    // Test Bedrock connection
    const bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
    
    console.log('✅ Bedrock client initialized successfully')
    console.log('🎉 AWS setup is working!')
    
  } catch (error) {
    console.log('❌ AWS connection failed:', error.message)
    console.log('Check your credentials and permissions')
  }
}

testAWSConnection()