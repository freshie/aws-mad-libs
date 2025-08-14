"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const StoryGenerator_1 = require("./services/StoryGenerator");
const dateUtils_1 = require("./utils/dateUtils");
const handler = async (event) => {
    console.log('Story Fill Lambda invoked:', JSON.stringify(event, null, 2));
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
        const { template, wordSubmissions } = JSON.parse(event.body);
        if (!template || !wordSubmissions) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                },
                body: JSON.stringify({ error: 'Template and wordSubmissions are required' }),
            };
        }
        console.log('🚨🚨🚨 === STORY FILL LAMBDA CALLED ===');
        console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
        console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        const deserializedTemplate = (0, dateUtils_1.deserializeDates)(template);
        const deserializedWordSubmissions = (0, dateUtils_1.deserializeDates)(wordSubmissions);
        const storyGenerator = StoryGenerator_1.StoryGenerator.getInstance();
        console.log('🔧 Lambda: StoryGenerator created, using mock:', storyGenerator.useMock);
        console.log('🔧 Lambda: Template has', deserializedTemplate.paragraphs.length, 'paragraphs');
        console.log('🔧 Lambda: Received', deserializedWordSubmissions.length, 'word submissions');
        const firstParagraph = deserializedTemplate.paragraphs[0];
        console.log('🔧 Lambda: First paragraph text:', firstParagraph.text);
        console.log('🔧 Lambda: First paragraph word blanks:', firstParagraph.wordBlanks.map((wb) => ({ id: wb.id, type: wb.type, position: wb.position })));
        console.log('🔧 Lambda: Word submissions:', deserializedWordSubmissions.map((ws) => ({ id: ws.wordBlankId, word: ws.word, type: ws.wordType })));
        const allWordBlanks = deserializedTemplate.paragraphs.flatMap((p) => p.wordBlanks);
        const submissionIds = new Set(deserializedWordSubmissions.map((ws) => ws.wordBlankId));
        const missingSubmissions = allWordBlanks.filter((wb) => !submissionIds.has(wb.id));
        if (missingSubmissions.length > 0) {
            console.error('🚨 Lambda: Missing word submissions for blanks:', missingSubmissions.map((wb) => ({ id: wb.id, type: wb.type, position: wb.position })));
        }
        else {
            console.log('✅ Lambda: All word blanks have corresponding submissions');
        }
        const story = await storyGenerator.fillTemplate(deserializedTemplate, deserializedWordSubmissions);
        console.log('🔧 Lambda: Story generated, first paragraph has image:', !!story.paragraphs[0]?.imageUrl);
        console.log('🔧 Lambda: Story has', story.paragraphs.length, 'paragraphs');
        console.log('🔧 Lambda: First paragraph highlights:', story.paragraphs[0]?.wordHighlights?.length || 0);
        console.log('🚨 Lambda FINAL CHECK: First paragraph text being returned:', story.paragraphs[0]?.text);
        console.log('🚨 Lambda FINAL CHECK: Text contains placeholders:', (story.paragraphs[0]?.text || '').match(/\{[^}]+\}/g) || 'none');
        console.log('🚨 Lambda FINAL CHECK: Highlights being returned:', story.paragraphs[0]?.wordHighlights?.map((h) => ({ word: h.word, start: h.startIndex, end: h.endIndex })) || []);
        const serializedStory = (0, dateUtils_1.serializeDates)(story);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({ story: serializedStory }),
        };
    }
    catch (error) {
        console.error('Error filling story template:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: JSON.stringify({
                error: 'Failed to generate story',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
        };
    }
};
exports.handler = handler;
