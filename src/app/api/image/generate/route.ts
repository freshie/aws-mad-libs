import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerator } from '@/services/ImageGenerator'

export async function POST(request: NextRequest) {
  try {
    const { prompt, style } = await request.json()
    
    console.log('🎨 API: Generating image with prompt:', prompt)
    
    const imageGenerator = ImageGenerator.getInstance()
    const result = await imageGenerator.generateImage(prompt, style || { style: 'cartoon', colorScheme: 'vibrant' })
    
    console.log('✅ API: Image generated successfully:', result.url)
    
    return NextResponse.json({ image: result })
  } catch (error) {
    console.error('❌ API: Image generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}