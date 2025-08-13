// Utility to ensure environment variables are loaded
import { config } from 'dotenv'
import { join } from 'path'

let envLoaded = false

export function loadEnvironmentVariables() {
  if (!envLoaded) {
    // Load .env.local file explicitly
    config({ path: join(process.cwd(), '.env.local') })
    envLoaded = true
    
    console.log('Environment variables loaded:')
    console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set')
    console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set')
    console.log('- AWS_REGION:', process.env.AWS_REGION)
    console.log('- S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME)
    console.log('- NODE_ENV:', process.env.NODE_ENV)
  }
}