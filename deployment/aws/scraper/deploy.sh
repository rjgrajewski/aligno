#!/bin/bash

# Deploy script for Aligno Scraper to AWS Fargate
set -e

# Configuration
AWS_REGION="eu-central-1"
AWS_ACCOUNT_ID="889572107937"
ECR_REPOSITORY="scraper"
ECS_CLUSTER="scraper-cluster"
ECS_SERVICE="scraper-service"
TASK_DEFINITION_FAMILY="scraper"

echo "🚀 Starting deployment of Aligno Scraper to AWS Fargate..."

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI configured"

# Create ECR repository if it doesn't exist
echo "📦 Setting up ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || {
    echo "Creating ECR repository..."
    aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION
}

# Get ECR login token
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t $ECR_REPOSITORY -f Dockerfile ../../..

# Tag image for ECR
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "✅ Image pushed successfully"

# Create CloudWatch log group if it doesn't exist
echo "📝 Setting up CloudWatch logs..."
aws logs describe-log-groups --log-group-name-prefix "/ecs/$ECR_REPOSITORY" --region $AWS_REGION 2>/dev/null | grep -q "/ecs/$ECR_REPOSITORY" || {
    echo "Creating CloudWatch log group..."
    aws logs create-log-group --log-group-name "/ecs/$ECR_REPOSITORY" --region $AWS_REGION
}

# Register new task definition
echo "📋 Registering new task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
    --cli-input-json file://ecs-task-definition.json \
    --region $AWS_REGION \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

echo "✅ Task definition registered: $TASK_DEFINITION_ARN"

# Create ECS cluster if it doesn't exist or is inactive
echo "🏗️ Setting up ECS cluster..."
CLUSTER_STATUS=$(aws ecs describe-clusters --clusters $ECS_CLUSTER --region $AWS_REGION --query 'clusters[0].status' --output text 2>/dev/null)

if [ "$CLUSTER_STATUS" == "INACTIVE" ] || [ "$CLUSTER_STATUS" == "None" ] || [ -z "$CLUSTER_STATUS" ]; then
    echo "Creating ECS cluster..."
    aws ecs create-cluster --cluster-name $ECS_CLUSTER --region $AWS_REGION
    echo "✅ Cluster created"
else
    echo "✅ Cluster already exists and is active"
fi

# Get VPC and subnet information
echo "🔍 Finding network configuration..."

# Find default VPC or first available VPC
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text 2>/dev/null || \
         aws ec2 describe-vpcs --region $AWS_REGION --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    echo "❌ No VPC found. Please run setup-infrastructure.sh first."
    exit 1
fi

echo "Found VPC: $VPC_ID"

# Get subnets in the VPC
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --region $AWS_REGION --query 'Subnets[*].SubnetId' --output text)

if [ -z "$SUBNET_IDS" ]; then
    echo "❌ No subnets found in VPC. Please run setup-infrastructure.sh first."
    exit 1
fi

# Convert to comma-separated list for the first subnet
SUBNET_ID=$(echo $SUBNET_IDS | awk '{print $1}')
echo "Using subnet: $SUBNET_ID"

# Find or create security group
SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=scraper-sg" "Name=vpc-id,Values=$VPC_ID" \
    --region $AWS_REGION \
    --query 'SecurityGroups[0].GroupId' \
    --output text 2>/dev/null)

if [ "$SECURITY_GROUP_ID" == "None" ] || [ -z "$SECURITY_GROUP_ID" ]; then
    echo "Creating security group..."
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name scraper-sg \
        --description "Security group for Scraper" \
        --vpc-id $VPC_ID \
        --region $AWS_REGION \
        --query 'GroupId' \
        --output text)
    
    # Allow all outbound traffic
    aws ec2 authorize-security-group-egress \
        --group-id $SECURITY_GROUP_ID \
        --protocol -1 \
        --cidr 0.0.0.0/0 \
        --region $AWS_REGION 2>/dev/null || true
fi

echo "Using security group: $SECURITY_GROUP_ID"

# Create or update ECS service
echo "🔄 Updating ECS service..."
if aws ecs describe-services --cluster $ECS_CLUSTER --services $ECS_SERVICE --region $AWS_REGION 2>/dev/null | grep -q "ACTIVE"; then
    echo "Updating existing service..."
    aws ecs update-service \
        --cluster $ECS_CLUSTER \
        --service $ECS_SERVICE \
        --task-definition $TASK_DEFINITION_FAMILY \
        --region $AWS_REGION
else
    echo "Creating new service..."
    aws ecs create-service \
        --cluster $ECS_CLUSTER \
        --service-name $ECS_SERVICE \
        --task-definition $TASK_DEFINITION_FAMILY \
        --desired-count 1 \
        --launch-type FARGATE \
        --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=ENABLED}" \
        --region $AWS_REGION
fi

echo "🎉 Deployment completed successfully!"
echo "📊 You can monitor the service in the AWS ECS console:"
echo "   https://$AWS_REGION.console.aws.amazon.com/ecs/v2/clusters/$ECS_CLUSTER/services/$ECS_SERVICE"
