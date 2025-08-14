"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoryGenerator = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const types_1 = require("../types");
const uuid_1 = require("uuid");
class StoryGenerator {
    constructor() {
        this.bedrockClient = null;
        this.useMock = !process.env.AWS_ACCESS_KEY_ID ||
            !process.env.AWS_SECRET_ACCESS_KEY;
        console.log('StoryGenerator constructor - useMock:', this.useMock);
        if (!this.useMock) {
            this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
                region: process.env.AWS_REGION || 'us-east-1',
                credentials: {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
                },
            });
        }
    }
    static getInstance() {
        if (!StoryGenerator.instance) {
            StoryGenerator.instance = new StoryGenerator();
        }
        return StoryGenerator.instance;
    }
    static resetInstance() {
        StoryGenerator.instance = null;
    }
    async generateTemplate(theme, playerCount = 4) {
        if (this.useMock) {
            return this.generateMockTemplate(theme, playerCount);
        }
        try {
            const prompt = this.createTemplatePrompt(theme, playerCount);
            const response = await this.invokeBedrockModel(prompt);
            return this.parseTemplateResponse(response, theme, playerCount);
        }
        catch (error) {
            console.error('Error generating story template with Bedrock, falling back to mock:', error);
            return this.generateMockTemplate(theme, playerCount);
        }
    }
    async fillTemplate(template, words) {
        try {
            let fullStoryText = template.paragraphs.map(p => p.text).join(' ');
            const wordHighlights = [];
            console.log('⚡ === LAMBDA STORY GENERATOR ===');
            console.log('⚡ Full story text:', fullStoryText);
            console.log('⚡ Processing', words.length, 'word submissions');
            words.forEach((submission, index) => {
                const placeholder = `{${this.wordTypeToPlaceholder(submission.wordType)}}`;
                console.log(`⚡ Word ${index + 1}/${words.length}: "${submission.word}" for placeholder "${placeholder}"`);
                const placeholderIndex = fullStoryText.indexOf(placeholder);
                if (placeholderIndex !== -1) {
                    wordHighlights.push({
                        word: submission.word,
                        playerUsername: submission.playerUsername,
                        wordType: submission.wordType,
                        startIndex: placeholderIndex,
                        endIndex: placeholderIndex + submission.word.length
                    });
                    fullStoryText = fullStoryText.replace(placeholder, submission.word);
                    console.log(`⚡ Replaced "${placeholder}" with "${submission.word}"`);
                }
                else {
                    console.error(`⚡ Could not find placeholder "${placeholder}" in story`);
                }
            });
            const originalTexts = template.paragraphs.map(p => p.text);
            const filledTexts = this.splitFilledTextIntoParagraphs(fullStoryText, originalTexts);
            const completedParagraphs = template.paragraphs.map((paragraph, index) => {
                return {
                    id: paragraph.id,
                    text: filledTexts[index] || paragraph.text,
                    imageUrl: null,
                    wordHighlights: []
                };
            });
            const playerContributions = this.createPlayerContributions(words);
            const story = {
                id: (0, uuid_1.v4)(),
                title: template.title,
                theme: template.theme,
                paragraphs: completedParagraphs,
                playerContributions,
                createdAt: new Date()
            };
            return story;
        }
        catch (error) {
            console.error('Error filling template:', error);
            throw error;
        }
    }
    validateTemplate(template) {
        if (!template || !template.paragraphs || template.paragraphs.length === 0) {
            return false;
        }
        return template.paragraphs.every(p => p.wordBlanks && p.wordBlanks.length > 0);
    }
    async invokeBedrockModel(prompt) {
        if (!this.bedrockClient) {
            throw new Error('Bedrock client not initialized');
        }
        const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';
        const payload = {
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            inferenceConfig: {
                max_new_tokens: 2000,
                temperature: 0.7,
                top_p: 0.9
            }
        };
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId,
            body: JSON.stringify(payload),
            contentType: 'application/json',
            accept: 'application/json'
        });
        const response = await this.bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.output.message.content[0].text;
    }
    createTemplatePrompt(theme, playerCount = 4) {
        const themeText = theme ? `with a ${theme} theme` : 'with any fun theme';
        return `Create a Mad Libs story template ${themeText} that will be fun when filled with random words. 

Requirements:
- Create a story with exactly 4 paragraphs
- Each paragraph must have exactly 4 sentences
- Include exactly 16 word blanks total (exactly 4 per paragraph, 1 per sentence)
- Use these word types: noun, verb, adjective, adverb, plural_noun, past_tense_verb, color, number, place, person
- Make the story family-friendly but funny
- Each sentence should have exactly ONE word blank
- Use placeholders like {noun}, {adjective}, etc.
- Structure: 4 paragraphs × 4 sentences × 1 word = 16 words total
- Include an image description for each paragraph

Format your response as JSON:
{
  "title": "Story Title",
  "theme": "${theme || 'adventure'}",
  "paragraphs": [
    {
      "text": "Story text with {word_type} placeholders",
      "imagePrompt": "Description for AI image generation"
    }
  ]
}

Make it creative and funny!`;
    }
    parseTemplateResponse(response, theme, playerCount = 4) {
        try {
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            const parsed = JSON.parse(cleanResponse);
            const paragraphs = parsed.paragraphs.map((p, pIndex) => {
                const wordBlanks = [];
                let position = 0;
                const regex = /\{(\w+)\}/g;
                let match;
                while ((match = regex.exec(p.text)) !== null) {
                    const wordType = this.normalizeWordType(match[1]);
                    if (wordType) {
                        wordBlanks.push({
                            id: (0, uuid_1.v4)(),
                            type: wordType,
                            position: position++,
                            assignedPlayerId: null
                        });
                    }
                }
                return {
                    id: (0, uuid_1.v4)(),
                    text: p.text,
                    wordBlanks,
                    imagePrompt: p.imagePrompt || `Scene from paragraph ${pIndex + 1}`
                };
            });
            const totalWordBlanks = paragraphs.reduce((sum, p) => sum + p.wordBlanks.length, 0);
            if (totalWordBlanks !== 16) {
                console.log(`AI generated ${totalWordBlanks} words (expected 16), falling back to mock template`);
                return this.generateMockTemplate(theme, playerCount);
            }
            return {
                id: (0, uuid_1.v4)(),
                title: parsed.title || 'AI Generated Story',
                paragraphs,
                totalWordBlanks,
                theme: theme || parsed.theme || 'adventure',
                difficulty: 'medium'
            };
        }
        catch (error) {
            console.error('Error parsing template response:', error);
            throw new Error('Failed to parse AI response');
        }
    }
    normalizeWordType(type) {
        const normalized = type.toLowerCase().replace(/[_\s]/g, '_');
        const typeMap = {
            'noun': types_1.WordType.NOUN,
            'verb': types_1.WordType.VERB,
            'adjective': types_1.WordType.ADJECTIVE,
            'adverb': types_1.WordType.ADVERB,
            'plural_noun': types_1.WordType.PLURAL_NOUN,
            'past_tense_verb': types_1.WordType.PAST_TENSE_VERB,
            'color': types_1.WordType.COLOR,
            'number': types_1.WordType.NUMBER,
            'place': types_1.WordType.PLACE,
            'person': types_1.WordType.PERSON
        };
        return typeMap[normalized] || null;
    }
    generateMockTemplate(theme, playerCount = 4) {
        const paragraphs = [
            {
                id: (0, uuid_1.v4)(),
                text: "Once upon a time, there was a {adjective} {noun} who loved to {verb} {adverb}.",
                wordBlanks: [
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.ADJECTIVE, position: 0, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.NOUN, position: 1, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.VERB, position: 2, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.ADVERB, position: 3, assignedPlayerId: null }
                ],
                imagePrompt: "A whimsical character in a fairy tale setting"
            },
            {
                id: (0, uuid_1.v4)(),
                text: "Every day, they would visit the {color} {place} with {number} {plural_noun}.",
                wordBlanks: [
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.COLOR, position: 0, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.PLACE, position: 1, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.NUMBER, position: 2, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.PLURAL_NOUN, position: 3, assignedPlayerId: null }
                ],
                imagePrompt: "A colorful location with various objects"
            },
            {
                id: (0, uuid_1.v4)(),
                text: "One day, {person} {past_tense_verb} and everything changed forever!",
                wordBlanks: [
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.PERSON, position: 0, assignedPlayerId: null },
                    { id: (0, uuid_1.v4)(), type: types_1.WordType.PAST_TENSE_VERB, position: 1, assignedPlayerId: null }
                ],
                imagePrompt: "A dramatic moment with a person taking action"
            }
        ];
        const allWordBlanks = paragraphs.flatMap(p => p.wordBlanks);
        return {
            id: (0, uuid_1.v4)(),
            title: "A Magical Adventure",
            paragraphs,
            totalWordBlanks: allWordBlanks.length,
            theme: theme || "adventure",
            difficulty: 'easy'
        };
    }
    wordTypeToPlaceholder(wordType) {
        switch (wordType) {
            case types_1.WordType.NOUN: return 'noun';
            case types_1.WordType.VERB: return 'verb';
            case types_1.WordType.ADJECTIVE: return 'adjective';
            case types_1.WordType.ADVERB: return 'adverb';
            case types_1.WordType.PLURAL_NOUN: return 'plural_noun';
            case types_1.WordType.PAST_TENSE_VERB: return 'past_tense_verb';
            case types_1.WordType.COLOR: return 'color';
            case types_1.WordType.NUMBER: return 'number';
            case types_1.WordType.PLACE: return 'place';
            case types_1.WordType.PERSON: return 'person';
            default: return String(wordType).toLowerCase();
        }
    }
    splitFilledTextIntoParagraphs(filledText, originalTexts) {
        const result = [];
        let remainingText = filledText;
        for (let i = 0; i < originalTexts.length; i++) {
            const originalText = originalTexts[i];
            const originalWordCount = originalText.split(/\s+/).length;
            const words = remainingText.split(/\s+/);
            const paragraphWords = words.slice(0, originalWordCount);
            const paragraphText = paragraphWords.join(' ');
            result.push(paragraphText);
            remainingText = words.slice(originalWordCount).join(' ');
        }
        return result;
    }
    createPlayerContributions(words) {
        const contributionMap = new Map();
        words.forEach(word => {
            if (!contributionMap.has(word.playerId)) {
                contributionMap.set(word.playerId, {
                    playerId: word.playerId,
                    playerUsername: word.playerUsername,
                    wordsContributed: []
                });
            }
            contributionMap.get(word.playerId).wordsContributed.push(word.word);
        });
        return Array.from(contributionMap.values());
    }
}
exports.StoryGenerator = StoryGenerator;
StoryGenerator.instance = null;
