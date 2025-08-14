"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageGenerator = void 0;
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const uuid_1 = require("uuid");
class ImageGenerator {
    constructor() {
        this.bedrockClient = null;
        this.s3Client = null;
        this.bucketName = process.env.S3_BUCKET_NAME || 'ai-mad-libs-media';
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            throw new Error('AWS credentials are required for image generation. Please configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
        }
        console.log('ImageGenerator constructor - using AWS Bedrock for image generation');
        const region = process.env.AWS_REGION || 'us-east-1';
        const credentials = {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({ region, credentials });
        this.s3Client = new client_s3_1.S3Client({ region, credentials });
    }
    static getInstance() {
        if (!ImageGenerator.instance) {
            ImageGenerator.instance = new ImageGenerator();
        }
        return ImageGenerator.instance;
    }
    static resetInstance() {
        ImageGenerator.instance = null;
    }
    async generateImage(prompt, style = { style: 'cartoon', colorScheme: 'vibrant' }) {
        if (!this.bedrockClient || !this.s3Client) {
            throw new Error('AWS Bedrock and S3 clients are not initialized. Please check your AWS credentials.');
        }
        return this.generateImageWithRetry(prompt, style, 0);
    }
    async generateImageWithRetry(prompt, style, attempt) {
        const maxAttempts = 4;
        const backoffDelays = [0, 15000, 30000, 60000, 120000];
        try {
            if (attempt > 0) {
                console.log(`⏳ Retrying image generation (attempt ${attempt + 1}/${maxAttempts}) after ${backoffDelays[attempt] / 1000}s delay`);
                await this.sleep(backoffDelays[attempt]);
            }
            console.log('🎨 Generating image with Bedrock Nova:', prompt);
            const enhancedPrompt = this.enhancePrompt(prompt, style);
            const imageData = await this.invokeBedrockImageModel(enhancedPrompt);
            const imageUrl = await this.uploadToS3(imageData, prompt);
            console.log('✅ Image generated successfully:', imageUrl);
            return {
                id: (0, uuid_1.v4)(),
                url: imageUrl,
                prompt: enhancedPrompt,
                width: 512,
                height: 512,
                createdAt: new Date()
            };
        }
        catch (error) {
            console.error(`❌ Error generating image (attempt ${attempt + 1}):`, error);
            if (error.name === 'ThrottlingException' && attempt < maxAttempts - 1) {
                console.log(`🔄 Throttling detected, will retry in ${backoffDelays[attempt + 1] / 1000} seconds...`);
                return this.generateImageWithRetry(prompt, style, attempt + 1);
            }
            console.error('🚨 All retry attempts failed or non-throttling error');
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                code: error.code || 'Unknown'
            });
            throw error;
        }
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async generateBatch(prompts, style = { style: 'cartoon', colorScheme: 'vibrant' }) {
        if (!this.bedrockClient || !this.s3Client) {
            throw new Error('AWS Bedrock and S3 clients are not initialized. Please check your AWS credentials.');
        }
        const results = [];
        for (let i = 0; i < prompts.length; i++) {
            const prompt = prompts[i];
            try {
                console.log(`🎨 Generating batch image ${i + 1}/${prompts.length}`);
                const result = await this.generateImage(prompt, style);
                results.push(result);
                if (i < prompts.length - 1) {
                    console.log(`⏳ Waiting 5 seconds before next batch image...`);
                    await this.sleep(5000);
                }
            }
            catch (error) {
                console.error(`Error generating batch image for prompt "${prompt}":`, error);
                throw error;
            }
        }
        return results;
    }
    async optimizeForVideo(image) {
        return {
            ...image,
            width: 1024,
            height: 576,
        };
    }
    async invokeBedrockImageModel(prompt) {
        if (!this.bedrockClient) {
            throw new Error('Bedrock client not initialized');
        }
        const modelId = process.env.BEDROCK_IMAGE_MODEL_ID || 'amazon.nova-canvas-v1:0';
        const payload = {
            taskType: "TEXT_IMAGE",
            textToImageParams: {
                text: prompt,
                negativeText: "blurry, low quality, distorted, text, watermark, signature"
            },
            imageGenerationConfig: {
                numberOfImages: 1,
                height: 512,
                width: 512,
                cfgScale: 8.0,
                seed: Math.floor(Math.random() * 1000000)
            }
        };
        const command = new client_bedrock_runtime_1.InvokeModelCommand({
            modelId,
            body: JSON.stringify(payload),
            contentType: 'application/json',
            accept: 'application/json'
        });
        try {
            console.log('📡 Calling Bedrock Nova API with payload:', JSON.stringify(payload, null, 2));
            const response = await this.bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            console.log('📥 Bedrock response received:', {
                hasImages: !!responseBody.images,
                imageCount: responseBody.images?.length || 0
            });
            if (!responseBody.images || responseBody.images.length === 0) {
                throw new Error('No image generated by Bedrock Nova');
            }
            const base64Image = responseBody.images[0];
            return new Uint8Array(Buffer.from(base64Image, 'base64'));
        }
        catch (error) {
            console.error('🚨 Bedrock API call failed:', error);
            if (error.name === 'ValidationException') {
                console.error('💡 This is likely a payload format issue');
            }
            else if (error.name === 'ThrottlingException') {
                console.error('🚦 Rate limit exceeded - will retry with backoff');
            }
            else if (error.name === 'ServiceQuotaExceededException') {
                console.error('📊 Service quota exceeded - may need to request limit increase');
            }
            throw error;
        }
    }
    async uploadToS3(imageData, prompt) {
        if (!this.s3Client) {
            throw new Error('S3 client not initialized');
        }
        const key = `images/${(0, uuid_1.v4)()}.png`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: imageData,
            ContentType: 'image/png',
            Metadata: {
                prompt: prompt.substring(0, 1000),
                generatedAt: new Date().toISOString()
            }
        });
        await this.s3Client.send(command);
        const getCommand = new client_s3_1.GetObjectCommand({
            Bucket: this.bucketName,
            Key: key
        });
        return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });
    }
    enhancePrompt(prompt, style) {
        const styleModifiers = {
            cartoon: 'modern Hanna-Barbera cartoon style, 2020s animation, clean vector art, bold outlines, flat colors, contemporary cartoon design, animated series style',
            realistic: 'photorealistic, detailed, high quality',
            artistic: 'artistic, painterly, creative, stylized',
            comic: 'comic book style, bold lines, dynamic'
        };
        const colorModifiers = {
            vibrant: 'vibrant saturated colors, bright cheerful palette, bold color choices',
            pastel: 'soft pastel colors, gentle tones, muted palette',
            monochrome: 'black and white, high contrast, grayscale'
        };
        return `${prompt}, ${styleModifiers[style.style]}, ${colorModifiers[style.colorScheme]}, family-friendly, safe for work, no text, high quality, smooth gradients, modern cartoon illustration`;
    }
}
exports.ImageGenerator = ImageGenerator;
ImageGenerator.instance = null;
