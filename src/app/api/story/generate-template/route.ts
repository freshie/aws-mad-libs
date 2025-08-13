import { NextRequest, NextResponse } from 'next/server'
import { StoryGenerator } from '@/services/StoryGenerator'
import { serializeDates } from '@/utils/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const { theme, playerCount } = await request.json()
    
    const storyGenerator = StoryGenerator.getInstance()
    const template = await storyGenerator.generateTemplate(theme, playerCount)
    
    // Serialize dates for the response
    const serializedTemplate = serializeDates(template)
    
    return NextResponse.json({ template: serializedTemplate })
  } catch (error) {
    console.error('Error generating story template:', error)
    return NextResponse.json(
      { error: 'Failed to generate story template' },
      { status: 500 }
    )
  }
}