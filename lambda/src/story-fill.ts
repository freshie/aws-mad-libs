import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoryGenerator } from './services/StoryGenerator';
import { deserializeDates, serializeDates } from './utils/dateUtils';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Story Fill Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { template, wordSubmissions } = JSON.parse(event.body);

    // Validate input
    if (!template || !wordSubmissions) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Template and wordSubmissions are required' }),
      };
    }

    console.log('🚨🚨🚨 === STORY FILL LAMBDA CALLED ===');
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Deserialize dates from the request
    const deserializedTemplate = deserializeDates(template);
    const deserializedWordSubmissions = deserializeDates(wordSubmissions);

    const storyGenerator = StoryGenerator.getInstance();
    console.log('🔧 Lambda: StoryGenerator created, using mock:', (storyGenerator as any).useMock);
    console.log('🔧 Lambda: Template has', deserializedTemplate.paragraphs.length, 'paragraphs');
    console.log('🔧 Lambda: Received', deserializedWordSubmissions.length, 'word submissions');

    // Debug the first paragraph to see what word blanks exist
    const firstParagraph = deserializedTemplate.paragraphs[0];
    console.log('🔧 Lambda: First paragraph text:', firstParagraph.text);
    console.log('🔧 Lambda: First paragraph word blanks:', firstParagraph.wordBlanks.map((wb: any) => ({ id: wb.id, type: wb.type, position: wb.position })));
    console.log('🔧 Lambda: Word submissions:', deserializedWordSubmissions.map((ws: any) => ({ id: ws.wordBlankId, word: ws.word, type: ws.wordType })));

    // Check if word submissions match word blanks
    const allWordBlanks = deserializedTemplate.paragraphs.flatMap((p: any) => p.wordBlanks);
    const submissionIds = new Set(deserializedWordSubmissions.map((ws: any) => ws.wordBlankId));
    const missingSubmissions = allWordBlanks.filter((wb: any) => !submissionIds.has(wb.id));

    if (missingSubmissions.length > 0) {
      console.error('🚨 Lambda: Missing word submissions for blanks:', missingSubmissions.map((wb: any) => ({ id: wb.id, type: wb.type, position: wb.position })));
    } else {
      console.log('✅ Lambda: All word blanks have corresponding submissions');
    }

    const story = await storyGenerator.fillTemplate(deserializedTemplate, deserializedWordSubmissions);
    console.log('🔧 Lambda: Story generated, first paragraph has image:', !!story.paragraphs[0]?.imageUrl);
    console.log('🔧 Lambda: Story has', story.paragraphs.length, 'paragraphs');
    console.log('🔧 Lambda: First paragraph highlights:', story.paragraphs[0]?.wordHighlights?.length || 0);

    // CRITICAL DEBUG: Check what text we're actually returning
    console.log('🚨 Lambda FINAL CHECK: First paragraph text being returned:', story.paragraphs[0]?.text);
    console.log('🚨 Lambda FINAL CHECK: Text contains placeholders:', (story.paragraphs[0]?.text || '').match(/\{[^}]+\}/g) || 'none');
    console.log('🚨 Lambda FINAL CHECK: Highlights being returned:', story.paragraphs[0]?.wordHighlights?.map((h: any) => ({ word: h.word, start: h.startIndex, end: h.endIndex })) || []);

    // Serialize dates for the response
    const serializedStory = serializeDates(story);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ story: serializedStory }),
    };
  } catch (error) {
    console.error('Error filling story template:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Failed to generate story',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};