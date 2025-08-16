import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyInput } = body

    // Validate input
    if (!storyInput || !storyInput.images || storyInput.images.length === 0) {
      return NextResponse.json(
        { error: 'Story input with images is required' },
        { status: 400 }
      )
    }

    // Call the Lambda function
    const lambdaUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL
    if (!lambdaUrl) {
      throw new Error('API URL not configured')
    }

    const response = await fetch(`${lambdaUrl}/video-generation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyInput
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Video generation failed')
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Video generation API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate video',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}