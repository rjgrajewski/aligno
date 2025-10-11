#!/bin/bash

# Audit AWS resources for Aligno Scout
set -e

AWS_REGION="eu-central-1"

echo "🔍 Auditing AWS resources for Aligno Scout..."
echo "Region: $AWS_REGION"
echo ""

# Function to print section header
print_section() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📦 $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ECS Resources
print_section "ECS Resources"
echo "Clusters:"
aws ecs list-clusters --region $AWS_REGION --query 'clusterArns[]' --output text 2>/dev/null | grep -i scout || echo "   None found"

echo ""
echo "Task Definitions (scout):"
aws ecs list-task-definitions --family-prefix scout --region $AWS_REGION --query 'taskDefinitionArns[]' --output text 2>/dev/null | head -5 || echo "   None found"
TASK_DEF_COUNT=$(aws ecs list-task-definitions --family-prefix scout --region $AWS_REGION --query 'taskDefinitionArns[]' --output text 2>/dev/null | wc -l | xargs)
if [ "$TASK_DEF_COUNT" -gt 0 ]; then
    echo "   ... and $TASK_DEF_COUNT total versions"
fi

echo ""
echo "Task Definitions (scraper - legacy):"
aws ecs list-task-definitions --family-prefix scraper --region $AWS_REGION --query 'taskDefinitionArns[]' --output text 2>/dev/null | head -5 || echo "   None found"
SCRAPER_TASK_DEF_COUNT=$(aws ecs list-task-definitions --family-prefix scraper --region $AWS_REGION --query 'taskDefinitionArns[]' --output text 2>/dev/null | wc -l | xargs)
if [ "$SCRAPER_TASK_DEF_COUNT" -gt 0 ]; then
    echo "   ... and $SCRAPER_TASK_DEF_COUNT total versions"
fi

echo ""
echo "Task Definitions (aligno-scraper - legacy):"
aws ecs list-task-definitions --family-prefix aligno-scraper --region $AWS_REGION --query 'taskDefinitionArns[]' --output text 2>/dev/null | head -5 || echo "   None found"
ALIGNO_SCRAPER_TASK_DEF_COUNT=$(aws ecs list-task-definitions --family-prefix aligno-scraper --region $AWS_REGION --query 'taskDefinitionArns[]' --output text 2>/dev/null | wc -l | xargs)
if [ "$ALIGNO_SCRAPER_TASK_DEF_COUNT" -gt 0 ]; then
    echo "   ... and $ALIGNO_SCRAPER_TASK_DEF_COUNT total versions"
fi

# ECR Resources
print_section "ECR Repositories"
aws ecr describe-repositories --region $AWS_REGION --query 'repositories[?contains(repositoryName, `scout`) || contains(repositoryName, `aligno`)].{Name:repositoryName,Images:imageCount,Size:imageSizeInBytes}' --output table 2>/dev/null || echo "   None found"

# EventBridge Resources
print_section "EventBridge Rules"
aws events list-rules --region $AWS_REGION --query 'Rules[?contains(Name, `scout`) || contains(Name, `scraper`)].{Name:Name,State:State,Schedule:ScheduleExpression}' --output table 2>/dev/null || echo "   None found"

# EventBridge Scheduler (newer API)
print_section "EventBridge Scheduler Schedules"
aws scheduler list-schedules --region $AWS_REGION --query 'Schedules[?contains(Name, `scout`) || contains(Name, `scraper`)].{Name:Name,State:State,Schedule:ScheduleExpression}' --output table 2>/dev/null || echo "   None found (or Scheduler API not available)"

# CloudWatch Logs
print_section "CloudWatch Log Groups"
aws logs describe-log-groups --region $AWS_REGION --query 'logGroups[?contains(logGroupName, `scout`) || contains(logGroupName, `ecs`)].{Name:logGroupName,Size:storedBytes,Retention:retentionInDays}' --output table 2>/dev/null || echo "   None found"

# IAM Roles
print_section "IAM Roles"
echo "Scout-related roles:"
aws iam list-roles --query 'Roles[?contains(RoleName, `scout`) || contains(RoleName, `scraper`) || contains(RoleName, `aligno`)].{Name:RoleName,Created:CreateDate}' --output table 2>/dev/null || echo "   None found"

# VPC Resources
print_section "VPC Resources"
VPC_ID=$(aws ec2 describe-vpcs --region $AWS_REGION --filters "Name=cidr,Values=10.0.0.0/16" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "")

if [ ! -z "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
    echo "VPC: $VPC_ID (10.0.0.0/16)"
    
    echo ""
    echo "Subnets:"
    aws ec2 describe-subnets --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].{ID:SubnetId,CIDR:CidrBlock,AZ:AvailabilityZone}' --output table 2>/dev/null
    
    echo ""
    echo "Security Groups:"
    aws ec2 describe-security-groups --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].{Name:GroupName,ID:GroupId,Description:Description}' --output table 2>/dev/null
    
    echo ""
    echo "Internet Gateways:"
    aws ec2 describe-internet-gateways --region $AWS_REGION --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[].InternetGatewayId' --output text 2>/dev/null || echo "   None"
    
    echo ""
    echo "NAT Gateways:"
    aws ec2 describe-nat-gateways --region $AWS_REGION --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[?State!=`deleted`].{ID:NatGatewayId,State:State,Subnet:SubnetId}' --output table 2>/dev/null || echo "   None"
    
    echo ""
    echo "Route Tables (non-main):"
    aws ec2 describe-route-tables --region $AWS_REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text 2>/dev/null || echo "   None"
else
    echo "No VPC found with CIDR 10.0.0.0/16"
fi

# Elastic IPs
print_section "Elastic IPs"
aws ec2 describe-addresses --region $AWS_REGION --query 'Addresses[].{IP:PublicIp,AllocationId:AllocationId,Association:AssociationId}' --output table 2>/dev/null || echo "   None found"

# Secrets Manager
print_section "Secrets Manager"
echo "Scout/Aligno related secrets:"
aws secretsmanager list-secrets --region $AWS_REGION --query 'SecretList[?contains(Name, `scout`) || contains(Name, `aligno`)].{Name:Name,LastChanged:LastChangedDate}' --output table 2>/dev/null || echo "   None found"

echo ""
echo "RDS related secrets:"
aws secretsmanager list-secrets --region $AWS_REGION --query 'SecretList[?contains(Name, `rds`) || contains(Name, `db`)].{Name:Name,LastChanged:LastChangedDate}' --output table 2>/dev/null || echo "   None found"

# RDS Instances
print_section "RDS Instances"
echo "Scout/Aligno related databases:"
aws rds describe-db-instances --region $AWS_REGION --query 'DBInstances[?contains(DBInstanceIdentifier, `aligno`) || contains(DBInstanceIdentifier, `scout`)].{ID:DBInstanceIdentifier,Status:DBInstanceStatus,Engine:Engine,Size:DBInstanceClass}' --output table 2>/dev/null || echo "   None found"

echo ""
echo "All RDS instances:"
aws rds describe-db-instances --region $AWS_REGION --query 'DBInstances[].{ID:DBInstanceIdentifier,Status:DBInstanceStatus,Engine:Engine,Size:DBInstanceClass}' --output table 2>/dev/null || echo "   None found"

# CloudWatch Alarms
print_section "CloudWatch Alarms"
aws cloudwatch describe-alarms --region $AWS_REGION --query 'MetricAlarms[?contains(AlarmName, `scout`) || contains(AlarmName, `aligno`)].{Name:AlarmName,State:StateValue,Metric:MetricName}' --output table 2>/dev/null || echo "   None found"

# SNS Topics
print_section "SNS Topics"
aws sns list-topics --region $AWS_REGION --query 'Topics[?contains(TopicArn, `scout`) || contains(TopicArn, `aligno`)].TopicArn' --output table 2>/dev/null || echo "   None found"

# SQS Queues
print_section "SQS Queues"
aws sqs list-queues --region $AWS_REGION --queue-name-prefix scout 2>/dev/null | grep -i scout || echo "   None found"
aws sqs list-queues --region $AWS_REGION --queue-name-prefix aligno 2>/dev/null | grep -i aligno || true

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Audit completed!"
echo ""
echo "💡 To cleanup these resources, run: ./cleanup-aws.sh"
echo ""

