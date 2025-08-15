#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MadLibsServerlessStack } from './mad-libs-serverless-stack';

const app = new cdk.App();

// Get environment from context or environment variables
const environment = app.node.tryGetContext('environment') || process.env.NODE_ENV || 'development';
const stackName = `MadLibsServerless-${environment}`;

new MadLibsServerlessStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Mad Libs Serverless Game Stack - ${environment}`,
  tags: {
    Project: 'MadLibsGame',
    Environment: environment,
    ManagedBy: 'CDK',
  },
});