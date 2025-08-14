import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoryGenerator } from './services/StoryGenerator';
import { ImageGenerator } from './services/ImageGenerator';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Test AWS Lambda invoked:', JSON.stringify(event, null, 2));

  try {
    console.log('=== AWS Test Lambda ===');
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? `Set (${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...)` : 'Not set');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set (hidden)' : 'Not set');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('TABLE_NAME:', process.env.TABLE_NAME);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Test StoryGenerator
    const storyGenerator = StoryGenerator.getInstance();
    const storyUseMock = (storyGenerator as any).useMock;
    console.log('StoryGenerator using mock:', storyUseMock);

    // Test ImageGenerator
    const imageGenerator = ImageGenerator.getInstance();
    const imageUseMock = (imageGenerator as any).useMock;
    console.log('ImageGenerator using mock:', imageUseMock);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({
        success: true,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          hasAWSCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
          awsRegion: process.env.AWS_REGION,
          tableName: process.env.TABLE_NAME,
        },
        services: {
          storyGeneratorUseMock: storyUseMock,
          imageGeneratorUseMock: imageUseMock,
        },
        lambda: {
          functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
          functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
          logGroupName: process.env.AWS_LAMBDA_LOG_GROUP_NAME,
          memorySize: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE,
        },
      }),
    };
  } catch (error) {
    console.error('Error in AWS test:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};