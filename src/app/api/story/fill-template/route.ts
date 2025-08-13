import { NextRequest, NextResponse } from 'next/server'
import { StoryGenerator } from '@/services/StoryGenerator'
import { deserializeDates, serializeDates } from '@/utils/dateUtils'
// Remove the loadEnv import for now

export async function POST(request: NextRequest) {
  try {
    // Check environment variables directly
    
    console.log('🚨🚨🚨 === STORY FILL TEMPLATE API CALLED ===')
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set')
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    const { template, wordSubmissions } = await request.json()
    
    // Deserialize dates from the request
    const deserializedTemplate = deserializeDates(template)
    const deserializedWordSubmissions = deserializeDates(wordSubmissions)
    
    const storyGenerator = StoryGenerator.getInstance()
    console.log('🔧 API: StoryGenerator created, using mock:', (storyGenerator as any).useMock)
    console.log('🔧 API: Template has', deserializedTemplate.paragraphs.length, 'paragraphs')
    console.log('🔧 API: Received', deserializedWordSubmissions.length, 'word submissions')
    
    // Debug the first paragraph to see what word blanks exist
    const firstParagraph = deserializedTemplate.paragraphs[0]
    console.log('🔧 API: First paragraph text:', firstParagraph.text)
    console.log('🔧 API: First paragraph word blanks:', firstParagraph.wordBlanks.map(wb => ({ id: wb.id, type: wb.type, position: wb.position })))
    console.log('🔧 API: Word submissions:', deserializedWordSubmissions.map(ws => ({ id: ws.wordBlankId, word: ws.word, type: ws.wordType })))
    
    // Check if word submissions match word blanks
    const allWordBlanks = deserializedTemplate.paragraphs.flatMap(p => p.wordBlanks)
    const submissionIds = new Set(deserializedWordSubmissions.map(ws => ws.wordBlankId))
    const missingSubmissions = allWordBlanks.filter(wb => !submissionIds.has(wb.id))
    
    if (missingSubmissions.length > 0) {
      console.error('🚨 API: Missing word submissions for blanks:', missingSubmissions.map(wb => ({ id: wb.id, type: wb.type, position: wb.position })))
    } else {
      console.log('✅ API: All word blanks have corresponding submissions')
    }
    
    const story = await storyGenerator.fillTemplate(deserializedTemplate, deserializedWordSubmissions)
    console.log('🔧 API: Story generated, first paragraph has image:', !!story.paragraphs[0]?.imageUrl)
    console.log('🔧 API: Story has', story.paragraphs.length, 'paragraphs')
    console.log('🔧 API: First paragraph highlights:', story.paragraphs[0]?.wordHighlights?.length || 0)
    
    // CRITICAL DEBUG: Check what text we're actually returning
    console.log('🚨 API FINAL CHECK: First paragraph text being returned:', story.paragraphs[0]?.text)
    console.log('🚨 API FINAL CHECK: Text contains placeholders:', (story.paragraphs[0]?.text || '').match(/\{[^}]+\}/g) || 'none')
    console.log('🚨 API FINAL CHECK: Highlights being returned:', story.paragraphs[0]?.wordHighlights?.map(h => ({ word: h.word, start: h.startIndex, end: h.endIndex })) || [])
    
    // Serialize dates for the response
    const serializedStory = serializeDates(story)
    
    return NextResponse.json({ story: serializedStory })
  } catch (error) {
    console.error('Error filling story template:', error)
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    )
  }
}