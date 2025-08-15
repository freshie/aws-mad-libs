import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ImageGenerator } from './services/ImageGenerator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Image generation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { prompt, style = 'photographic', referenceImageUrl } = body;

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          error: 'Invalid request. Prompt is required.',
        }),
      };
    }

    // Generate image with optional reference for character consistency
    const imageGenerator = ImageGenerator.getInstance();
    const result = await imageGenerator.generateImage(prompt, style, referenceImageUrl);

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
        result,
      }),
    };
  } catch (error) {
    console.error('Error generating image:', error);

    // Check if debug mode is enabled
    const isDebugMode = process.env.DEBUG_ERRORS === 'true';
    
    let errorResponse: any = {
      error: 'Failed to generate image',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    // Add detailed error information in debug mode
    if (isDebugMode) {
      errorResponse.debug = {
        name: (error as any).name,
        code: (error as any).code,
        statusCode: (error as any).$metadata?.httpStatusCode,
        requestId: (error as any).$metadata?.requestId,
        retryable: (error as any).$retryable,
        fault: (error as any).$fault,
        stack: error instanceof Error ? error.stack : undefined,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      };
      
      if ((error as any).$response) {
        errorResponse.debug.httpResponse = {
          statusCode: (error as any).$response.statusCode,
          statusMessage: (error as any).$response.statusMessage,
          headers: (error as any).$response.headers
        };
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};