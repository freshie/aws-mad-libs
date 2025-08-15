import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VideoGenerator, StoryVideoInput } from './services/VideoGenerator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Video generation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { storyInput }: { storyInput: StoryVideoInput } = body;

    // Validate input
    if (!storyInput || !storyInput.images || storyInput.images.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
        },
        body: JSON.stringify({
          error: 'Invalid request. Story input with images is required.',
        }),
      };
    }

    // Generate video
    const videoGenerator = VideoGenerator.getInstance();
    const result = await videoGenerator.generateStoryVideo(storyInput);

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
    console.error('Error generating video:', error);

    // Check if debug mode is enabled
    const isDebugMode = process.env.DEBUG_ERRORS === 'true';
    
    let errorResponse: any = {
      error: 'Failed to generate video',
      message: error instanceof Error ? error.message : 'Unknown error',
    };

    // Add detailed error information in debug mode
    if (isDebugMode) {
      errorResponse.debug = {
        name: (error as any).name,
        code: (error as any).code,
        stack: error instanceof Error ? error.stack : undefined,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      };
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