import { NextRequest, NextResponse } from 'next/server'
import { StoryGenerator } from '@/services/StoryGenerator'
import { ImageGenerator } from '@/services/ImageGenerator'

export async function GET() {
  try {
    console.log('=== AWS Test API ===')
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `Set (${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...)` : 'Not set')
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set (hidden)' : 'Not set')
    console.log('AWS_REGION:', process.env.AWS_REGION)
    console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME)
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    // Test StoryGenerator
    const storyGenerator = StoryGenerator.getInstance()
    const storyUseMock = (storyGenerator as any).useMock
    console.log('StoryGenerator using mock:', storyUseMock)
    
    // Test ImageGenerator
    const imageGenerator = ImageGenerator.getInstance()
    const imageUseMock = (imageGenerator as any).useMock
    console.log('ImageGenerator using mock:', imageUseMock)
    
    return NextResponse.json({
      success: true,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasAWSCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        awsRegion: process.env.AWS_REGION,
        s3Bucket: process.env.S3_BUCKET_NAME
      },
      services: {
        storyGeneratorUseMock: storyUseMock,
        imageGeneratorUseMock: imageUseMock
      }
    })
  } catch (error) {
    console.error('Error in AWS test:', error)
    return NextResponse.json(
      { error: 'Test failed', message: (error as Error).message },
      { status: 500 }
    )
  }
}