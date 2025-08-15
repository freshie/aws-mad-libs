import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { prompt, style } = await request.json()
    
    console.log('🎨 API: Generating image with prompt:', prompt)
    
    // Call the Lambda function directly via API Gateway
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://zxp4er3qjk.execute-api.us-east-1.amazonaws.com/prod'
    
    const response = await fetch(`${apiUrl}/image/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        style: style?.style || 'cartoon'
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to generate image')
    }
    
    const data = await response.json()
    console.log('🔍 API: Lambda response data:', JSON.stringify(data, null, 2))
    
    // Check if the Lambda response has the expected structure
    if (data.success && data.result) {
      console.log('✅ API: Image generated successfully via Lambda:', data.result.url)
      return NextResponse.json({ image: data.result })
    } else {
      console.error('❌ API: Lambda response missing success/result:', data)
      throw new Error(data.error || data.message || 'Invalid response from Lambda')
    }
  } catch (error) {
    console.error('❌ API: Image generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}