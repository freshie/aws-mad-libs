#!/bin/bash

# Mad Libs Serverless Deployment Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
REGION="us-east-1"
PROFILE=""
SKIP_BUILD=false
SKIP_TESTS=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV    Set environment (development, staging, production)"
    echo "  -r, --region REGION      Set AWS region (default: us-east-1)"
    echo "  -p, --profile PROFILE    Set AWS profile"
    echo "  --skip-build            Skip building Lambda functions"
    echo "  --skip-tests            Skip running tests"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e production -r us-west-2"
    echo "  $0 --environment staging --profile my-aws-profile"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -p|--profile)
            PROFILE="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Valid environments: development, staging, production"
    exit 1
fi

print_status "Starting deployment for environment: $ENVIRONMENT"
print_status "AWS Region: $REGION"

# Set AWS profile if provided
if [[ -n "$PROFILE" ]]; then
    export AWS_PROFILE="$PROFILE"
    print_status "Using AWS profile: $PROFILE"
fi

# Set environment variables
export NODE_ENV="$ENVIRONMENT"
export CDK_DEFAULT_REGION="$REGION"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_error "AWS CLI is not configured or credentials are invalid"
    print_error "Please run 'aws configure' or set up your AWS credentials"
    exit 1
fi

print_success "AWS credentials validated"

# Install dependencies if needed
if [[ ! -d "node_modules" ]]; then
    print_status "Installing dependencies..."
    npm install
fi

# Run tests unless skipped
if [[ "$SKIP_TESTS" == false ]]; then
    print_status "Running tests..."
    npm test
    print_success "Tests passed"
fi

# Build Lambda functions unless skipped
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building Lambda functions..."
    
    # Create lambda directory if it doesn't exist
    mkdir -p lambda/dist
    
    # Build Lambda functions (placeholder - will be implemented when Lambda code is ready)
    print_warning "Lambda function build not yet implemented"
    
    # For now, create placeholder files
    echo "console.log('Story generation handler');" > lambda/dist/story-generation.js
    echo "console.log('Story fill handler');" > lambda/dist/story-fill.js
    echo "console.log('Image generation handler');" > lambda/dist/image-generation.js
    echo "console.log('Test AWS handler');" > lambda/dist/test-aws.js
    
    print_success "Lambda functions built"
fi

# Bootstrap CDK if needed
print_status "Checking CDK bootstrap status..."
if ! aws cloudformation describe-stacks --stack-name CDKToolkit --region "$REGION" > /dev/null 2>&1; then
    print_status "Bootstrapping CDK..."
    npx cdk bootstrap --region "$REGION"
    print_success "CDK bootstrapped"
else
    print_status "CDK already bootstrapped"
fi

# Deploy CDK stack
print_status "Deploying CDK stack..."
STACK_NAME="MadLibsServerless-$ENVIRONMENT"

# Show diff first
print_status "Showing deployment diff..."
npx cdk diff "$STACK_NAME" --context environment="$ENVIRONMENT"

# Ask for confirmation in production
if [[ "$ENVIRONMENT" == "production" ]]; then
    echo ""
    read -p "Are you sure you want to deploy to PRODUCTION? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        print_warning "Deployment cancelled"
        exit 0
    fi
fi

# Deploy the stack
npx cdk deploy "$STACK_NAME" \
    --context environment="$ENVIRONMENT" \
    --require-approval never \
    --outputs-file "cdk-outputs-$ENVIRONMENT.json"

print_success "CDK stack deployed successfully"

# Show outputs
if [[ -f "cdk-outputs-$ENVIRONMENT.json" ]]; then
    print_status "Deployment outputs:"
    cat "cdk-outputs-$ENVIRONMENT.json" | jq '.'
fi

print_success "Deployment completed successfully!"
print_status "Environment: $ENVIRONMENT"
print_status "Region: $REGION"
print_status "Stack Name: $STACK_NAME"