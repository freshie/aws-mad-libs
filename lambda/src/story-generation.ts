import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoryGenerator } from './services/StoryGenerator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Story generation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { theme, playerCount } = body;

    // Validate input
    if (!playerCount || playerCount < 1 || playerCount > 8) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          error: 'Invalid player count. Must be between 1 and 8.',
        }),
      };
    }

    // Generate story template
    const storyGenerator = StoryGenerator.getInstance();
    const template = await storyGenerator.generateTemplate(theme, playerCount);

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
        template,
      }),
    };
  } catch (error) {
    console.error('Error generating story template:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Failed to generate story template',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};