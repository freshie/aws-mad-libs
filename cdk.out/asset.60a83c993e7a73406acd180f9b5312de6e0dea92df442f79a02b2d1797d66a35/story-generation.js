"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const StoryGenerator_1 = require("./services/StoryGenerator");
const dateUtils_1 = require("./utils/dateUtils");
const handler = async (event) => {
    console.log('Story Generation Lambda invoked:', JSON.stringify(event, null, 2));
    try {
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
        const storyGenerator = StoryGenerator_1.StoryGenerator.getInstance();
        const template = await storyGenerator.generateTemplate(theme, playerCount);
        const serializedTemplate = (0, dateUtils_1.serializeDates)(template);
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
    }
    catch (error) {
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
exports.handler = handler;
