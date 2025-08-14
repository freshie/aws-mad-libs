import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ImageGenerator } from './services/ImageGenerator';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Image Generation Lambda invoked:', JSON.stringify(event, null, 2));

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

    const { prompt, style } = JSON.parse(event.body);

    // Validate input
    if (!prompt) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    console.log('🎨 Lambda: Generating image with prompt:', prompt);

    const imageGenerator = ImageGenerator.getInstance();
    const result = await imageGenerator.generateImage(prompt, style || { style: 'cartoon', colorScheme: 'vibrant' });

    console.log('✅ Lambda: Image generated successfully:', result.url);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ image: result }),
    };
  } catch (error) {
    console.error('❌ Lambda: Image generation failed:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Failed to generate image',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};