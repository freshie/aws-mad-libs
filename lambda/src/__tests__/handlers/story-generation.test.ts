import { handler } from '../../story-generation';
import { StoryGenerator } from '../../services/StoryGenerator';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// Mock the StoryGenerator
jest.mock('../../services/StoryGenerator');

const mockStoryGenerator = {
  generateTemplate: jest.fn(),
};

(StoryGenerator.getInstance as jest.Mock).mockReturnValue(mockStoryGenerator);

describe('story-generation handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock template response
    const mockTemplate = {
      id: 'template1',
      title: 'Test Adventure',
      paragraphs: [{
        id: 'p1',
        text: 'The [ADJECTIVE] [NOUN] went to the [PLACE].',
        wordBlanks: [
          { id: 'w1', type: 'adjective', position: 4, assignedPlayerId: null },
          { id: 'w2', type: 'noun', position: 15, assignedPlayerId: null },
          { id: 'w3', type: 'place', position: 27, assignedPlayerId: null }
        ],
        imagePrompt: 'A character going to a place'
      }],
      totalWordBlanks: 3,
      theme: 'adventure',
      difficulty: 'easy'
    };
    
    mockStoryGenerator.generateTemplate.mockResolvedValue(mockTemplate);
  });

  const createMockEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/story-generation',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  it('should generate story template successfully', async () => {
    const event = createMockEvent({
      theme: 'adventure',
      playerCount: 3
    });

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    expect(responseBody).toHaveProperty('success', true);
    expect(responseBody).toHaveProperty('template');
    
    expect(mockStoryGenerator.generateTemplate).toHaveBeenCalledWith('adventure', 3);
  });

  it('should handle missing player count', async () => {
    const event = createMockEvent({});

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should handle invalid player count', async () => {
    const event = createMockEvent({ playerCount: 0 });

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should handle player count too high', async () => {
    const event = createMockEvent({ playerCount: 11 });

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should handle story generator errors', async () => {
    mockStoryGenerator.generateTemplate.mockRejectedValue(new Error('Generation failed'));
    
    const event = createMockEvent({ playerCount: 3 });

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Failed to generate story template');
  });

  it('should handle malformed JSON in request body', async () => {
    const event = {
      ...createMockEvent({}),
      body: 'invalid json'
    };

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(500);
    
    expect(responseBody).toHaveProperty('error');
  });

  it('should handle null request body', async () => {
    const event = {
      ...createMockEvent({}),
      body: null
    };

    const result = await handler(event) as APIGatewayProxyResult;
    const responseBody = JSON.parse(result.body);

    expect(result.statusCode).toBe(400);
    
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should use default theme when not provided', async () => {
    const event = createMockEvent({ playerCount: 2 });

    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(mockStoryGenerator.generateTemplate).toHaveBeenCalledWith(undefined, 2);
  });
});