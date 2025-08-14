#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MadLibsServerlessStack } from './mad-libs-serverless-stack';

const app = new cdk.App();

// Create the main serverless stack
new MadLibsServerlessStack(app, 'MadLibsServerlessStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless infrastructure for AI Mad Libs Party Game',
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'MadLibsGame');
cdk.Tags.of(app).add('Environment', process.env.NODE_ENV || 'development');