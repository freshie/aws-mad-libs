import { handler } from '../story-generation';
import { StoryGenerator } from '../services/StoryGenerator';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Mock the StoryGenerator
jest.mock('../services/StoryGenerator');

const mockStoryGenerator = {
  generateTemplate: jest.fn(),
};

(StoryGenerator.getInstance as jest.Mock).mockReturnValue(mockStoryGenerator);

describe('story-generation handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (body: any): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/api/story/generate-template',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
  });

  it('should generate story template successfully', async () => {
    const mockTemplate = {
      id: 'test-template',
      title: 'Test Adventure',
      paragraphs: [
        {
          id: 'p1',
          text: 'The [ADJECTIVE] [NOUN] went to the [PLACE].',
          wordBlanks: [
            { id: 'w1', type: 'adjective', position: 0, assignedPlayerId: null },
            { id: 'w2', type: 'noun', position: 1, assignedPlayerId: null },
            { id: 'w3', type: 'place', position: 2, assignedPlayerId: null }
          ],
          imagePrompt: 'A story scene'
        }
      ],
      totalWordBlanks: 3,
      theme: 'adventure',
      difficulty: 'easy' as const
    };

    mockStoryGenerator.generateTemplate.mockResolvedValue(mockTemplate);

    const event = createMockEvent({ theme: 'adventure', playerCount: 3 });
    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('success', true);
    expect(responseBody).toHaveProperty('template');
    expect(responseBody.template).toEqual(mockTemplate);
    
    expect(mockStoryGenerator.generateTemplate).toHaveBeenCalledWith('adventure', 3);
  });

  it('should handle missing player count', async () => {
    const event = createMockEvent({ theme: 'adventure' });
    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should handle invalid player count', async () => {
    const event = createMockEvent({ theme: 'adventure', playerCount: 0 });
    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should handle player count too high', async () => {
    const event = createMockEvent({ theme: 'adventure', playerCount: 10 });
    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should handle story generator errors', async () => {
    mockStoryGenerator.generateTemplate.mockRejectedValue(new Error('Story generation failed'));

    const event = createMockEvent({ theme: 'adventure', playerCount: 3 });
    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(500);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Failed to generate story template');
  });

  it('should handle malformed JSON in request body', async () => {
    const event: APIGatewayProxyEvent = {
      ...createMockEvent({}),
      body: 'invalid-json'
    };

    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(500);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
  });

  it('should handle null request body', async () => {
    const event: APIGatewayProxyEvent = {
      ...createMockEvent({}),
      body: null
    };

    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(400);
    
    const responseBody = JSON.parse(result.body);
    expect(responseBody).toHaveProperty('error');
    expect(responseBody.error).toContain('Invalid player count');
  });

  it('should use default theme when not provided', async () => {
    const mockTemplate = {
      id: 'test-template',
      title: 'Default Adventure',
      paragraphs: [],
      totalWordBlanks: 0,
      theme: 'adventure',
      difficulty: 'easy' as const
    };

    mockStoryGenerator.generateTemplate.mockResolvedValue(mockTemplate);

    const event = createMockEvent({ playerCount: 2 });
    const result = await handler(event) as APIGatewayProxyResult;

    expect(result.statusCode).toBe(200);
    expect(mockStoryGenerator.generateTemplate).toHaveBeenCalledWith(undefined, 2);
  });
});