import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoryGenerator } from './services/StoryGenerator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Story generation request:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const { theme, playerCount, exampleTemplate } = body;
    
    console.log('🔍 STORY-GENERATION: Request received:', {
      theme,
      playerCount,
      hasExampleTemplate: !!exampleTemplate
    });

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
    let template;
    
    let aiError = null;
    try {
      console.log('🔍 STORY-GENERATION: Attempting AI generation...');
      template = await storyGenerator.generateTemplate(theme, playerCount);
      console.log('🔍 STORY-GENERATION: AI generation successful:', { title: template.title });
    } catch (error) {
      aiError = {
        name: (error as any).name,
        message: (error as any).message,
        code: (error as any).code || 'Unknown'
      };
      console.log('🔍 STORY-GENERATION: AI generation failed:', aiError);
      console.log('🔍 STORY-GENERATION: Using exampleTemplate if available');
      
      if (exampleTemplate) {
        console.log('🔍 STORY-GENERATION: Using provided exampleTemplate:', { title: exampleTemplate.title });
        template = exampleTemplate;
      } else {
        console.log('🔍 STORY-GENERATION: No exampleTemplate, re-throwing error');
        throw error;
      }
    }

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
        debug: {
          usedAI: !aiError,
          usedExampleTemplate: !!aiError && !!exampleTemplate,
          usedFallback: !!aiError && !exampleTemplate,
          aiError: aiError
        }
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