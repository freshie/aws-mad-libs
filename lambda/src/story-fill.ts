import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoryGenerator } from './services/StoryGenerator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Story fill request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { template, words } = body;

    // Validate input
    if (!template || !words || !Array.isArray(words)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          error: 'Invalid request. Template and words array are required.',
        }),
      };
    }

    // Debug: Check what template we received
    console.log('🔍 STORY-FILL: Template received:', {
      id: template.id,
      title: template.title,
      theme: template.theme,
      paragraphCount: template.paragraphs?.length,
      totalWordBlanks: template.totalWordBlanks
    });
    
    // Fill story template with words
    const storyGenerator = StoryGenerator.getInstance();
    const story = await storyGenerator.fillTemplate(template, words);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        story,
      }),
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
        error: 'Failed to fill story template',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};