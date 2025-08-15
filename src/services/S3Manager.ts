import { S3Client, CreateBucketCommand, PutBucketCorsCommand, HeadBucketCommand } from '@aws-sdk/client-s3'

export class S3Manager {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'ai-mad-libs-media'
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  }

  async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }))
      console.log(`S3 bucket ${this.bucketName} already exists`)
    } catch (error: any) {
      if (error.name === 'NotFound') {
        console.log(`Creating S3 bucket ${this.bucketName}...`)
        await this.createBucket()
      } else {
        console.error('Error checking bucket existence:', error)
        throw error
      }
    }
  }

  private async createBucket(): Promise<void> {
    try {
      // Create bucket
      await this.s3Client.send(new CreateBucketCommand({
        Bucket: this.bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION !== 'us-east-1' ? process.env.AWS_REGION as any : undefined
        }
      }))

      // Set CORS configuration
      await this.s3Client.send(new PutBucketCorsCommand({
        Bucket: this.bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'HEAD'],
              AllowedOrigins: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3000
            }
          ]
        }
      }))

      console.log(`S3 bucket ${this.bucketName} created successfully`)
    } catch (error) {
      console.error('Error creating S3 bucket:', error)
      throw error
    }
  }

  getBucketName(): string {
    return this.bucketName
  }
}