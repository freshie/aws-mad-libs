import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Test AWS request:', JSON.stringify(event, null, 2));

  try {
    // Basic AWS connectivity test
    const testResults = {
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION || 'unknown',
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      tableName: process.env.TABLE_NAME || 'not-configured',
      imagesBucket: process.env.IMAGES_BUCKET_NAME || 'not-configured',
    };

    // Test environment variables
    const envCheck = {
      hasTableName: !!process.env.TABLE_NAME,
      hasImagesBucket: !!process.env.IMAGES_BUCKET_NAME,
      hasAwsRegion: !!process.env.AWS_REGION,
    };

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
        message: 'AWS Lambda function is working correctly',
        testResults,
        environmentCheck: envCheck,
        requestInfo: {
          method: event.httpMethod,
          path: event.path,
          queryParams: event.queryStringParameters,
          headers: event.headers,
        },
      }),
    };
  } catch (error) {
    console.error('Error in test AWS function:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: JSON.stringify({
        error: 'Test AWS function failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};