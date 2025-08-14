import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoryGenerator } from './services/StoryGenerator';
import { serializeDates } from './utils/dateUtils';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Story Generation Lambda invoked:', JSON.stringify(event, null, 2));

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

    const { theme, playerCount } = JSON.parse(event.body);

    // Validate input
    if (!theme || !playerCount) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Theme and playerCount are required' }),
      };
    }

    console.log(`Generating story template for theme: ${theme}, players: ${playerCount}`);

    // Generate story template
    const storyGenerator = StoryGenerator.getInstance();
    const template = await storyGenerator.generateTemplate(theme, playerCount);

    // Serialize dates for the response
    const serializedTemplate = serializeDates(template);

    console.log('Story template generated successfully');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ template: serializedTemplate }),
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
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};