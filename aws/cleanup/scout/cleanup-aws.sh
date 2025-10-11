#!/bin/bash

# Cleanup AWS resources for Aligno Scout (keeping RDS only)
set -e

AWS_REGION="eu-central-1"
CLUSTER_NAME="scout-cluster"

echo "🧹 Cleaning up AWS resources for Aligno Scout..."
echo "⚠️  This will delete everything EXCEPT the RDS database"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# 1. Stop and delete ECS tasks
echo ""
echo "🛑 Stopping ECS tasks..."
TASK_ARNS=$(aws ecs list-tasks \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION \
    --query 'taskArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$TASK_ARNS" ]; then
    for TASK_ARN in $TASK_ARNS; do
        echo "   Stopping task: $TASK_ARN"
        aws ecs stop-task \
            --cluster $CLUSTER_NAME \
            --task $TASK_ARN \
            --region $AWS_REGION >/dev/null || echo "   Failed to stop task"
    done
    echo "✅ Tasks stopped"
else
    echo "   No running tasks found"
fi

# 2. Delete ECS services
echo ""
echo "🗑️  Deleting ECS services..."
SERVICES=$(aws ecs list-services \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION \
    --query 'serviceArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SERVICES" ]; then
    for SERVICE_ARN in $SERVICES; do
        SERVICE_NAME=$(echo $SERVICE_ARN | awk -F/ '{print $NF}')
        echo "   Scaling down service: $SERVICE_NAME"
        aws ecs update-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --desired-count 0 \
            --region $AWS_REGION >/dev/null || echo "   Failed to scale down"
        
        echo "   Deleting service: $SERVICE_NAME"
        aws ecs delete-service \
            --cluster $CLUSTER_NAME \
            --service $SERVICE_NAME \
            --force \
            --region $AWS_REGION >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Services deleted"
else
    echo "   No services found"
fi

# 3. Delete ECS cluster
echo ""
echo "🗑️  Deleting ECS cluster..."
aws ecs delete-cluster \
    --cluster $CLUSTER_NAME \
    --region $AWS_REGION >/dev/null 2>&1 && echo "✅ Cluster deleted" || echo "   Cluster not found or already deleted"

# 4. Delete EventBridge scheduled tasks
echo ""
echo "🗑️  Deleting EventBridge rules..."
SCHEDULE_RULES=$(aws events list-rules \
    --region $AWS_REGION \
    --query 'Rules[?contains(Name, `scout`)].Name' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SCHEDULE_RULES" ]; then
    for RULE_NAME in $SCHEDULE_RULES; do
        echo "   Removing targets from rule: $RULE_NAME"
        # Get all target IDs
        TARGET_IDS=$(aws events list-targets-by-rule \
            --rule $RULE_NAME \
            --region $AWS_REGION \
            --query 'Targets[].Id' \
            --output text 2>/dev/null || echo "")
        
        if [ ! -z "$TARGET_IDS" ]; then
            aws events remove-targets \
                --rule $RULE_NAME \
                --ids $TARGET_IDS \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to remove targets"
        fi
        
        echo "   Deleting rule: $RULE_NAME"
        aws events delete-rule \
            --name $RULE_NAME \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete rule"
    done
    echo "✅ EventBridge rules deleted"
else
    echo "   No EventBridge rules found"
fi

# 5. Deregister task definitions
echo ""
echo "🗑️  Deregistering task definitions..."

# Scout task definitions
TASK_DEFS=$(aws ecs list-task-definitions \
    --family-prefix scout \
    --region $AWS_REGION \
    --query 'taskDefinitionArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$TASK_DEFS" ]; then
    for TASK_DEF in $TASK_DEFS; do
        echo "   Deregistering scout: $TASK_DEF"
        aws ecs deregister-task-definition \
            --task-definition $TASK_DEF \
            --region $AWS_REGION >/dev/null || echo "   Failed to deregister"
    done
    echo "✅ Scout task definitions deregistered"
else
    echo "   No scout task definitions found"
fi

# Legacy scraper task definitions
SCRAPER_TASK_DEFS=$(aws ecs list-task-definitions \
    --family-prefix scraper \
    --region $AWS_REGION \
    --query 'taskDefinitionArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SCRAPER_TASK_DEFS" ]; then
    for TASK_DEF in $SCRAPER_TASK_DEFS; do
        echo "   Deregistering scraper: $TASK_DEF"
        aws ecs deregister-task-definition \
            --task-definition $TASK_DEF \
            --region $AWS_REGION >/dev/null || echo "   Failed to deregister"
    done
    echo "✅ Scraper task definitions deregistered"
else
    echo "   No scraper task definitions found"
fi

# Legacy aligno-scraper task definitions
ALIGNO_SCRAPER_TASK_DEFS=$(aws ecs list-task-definitions \
    --family-prefix aligno-scraper \
    --region $AWS_REGION \
    --query 'taskDefinitionArns[]' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ALIGNO_SCRAPER_TASK_DEFS" ]; then
    for TASK_DEF in $ALIGNO_SCRAPER_TASK_DEFS; do
        echo "   Deregistering aligno-scraper: $TASK_DEF"
        aws ecs deregister-task-definition \
            --task-definition $TASK_DEF \
            --region $AWS_REGION >/dev/null || echo "   Failed to deregister"
    done
    echo "✅ Aligno-scraper task definitions deregistered"
else
    echo "   No aligno-scraper task definitions found"
fi

# 6. Delete ECR repository
echo ""
echo "🗑️  Deleting ECR repository..."
# Try both scout and aligno-scout names
aws ecr delete-repository \
    --repository-name scout \
    --force \
    --region $AWS_REGION >/dev/null 2>&1 && echo "✅ ECR repository 'scout' deleted" || true

aws ecr delete-repository \
    --repository-name aligno-scout \
    --force \
    --region $AWS_REGION >/dev/null 2>&1 && echo "✅ ECR repository 'aligno-scout' deleted" || echo "   No more ECR repositories to delete"

# 7. Delete CloudWatch log group
echo ""
echo "🗑️  Deleting CloudWatch log group..."
aws logs delete-log-group \
    --log-group-name /ecs/scout \
    --region $AWS_REGION 2>&1 && echo "✅ Log group deleted" || echo "   Log group not found or already deleted"

# 8. Delete EventBridge Scheduler schedules (newer API)
echo ""
echo "🗑️  Deleting EventBridge Scheduler schedules..."
SCHEDULES=$(aws scheduler list-schedules \
    --region $AWS_REGION \
    --query 'Schedules[?contains(Name, `scout`) || contains(Name, `scraper`)].Name' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SCHEDULES" ]; then
    for SCHEDULE_NAME in $SCHEDULES; do
        echo "   Deleting schedule: $SCHEDULE_NAME"
        aws scheduler delete-schedule \
            --name $SCHEDULE_NAME \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete schedule"
    done
    echo "✅ Scheduler schedules deleted"
else
    echo "   No Scheduler schedules found"
fi

# 9. Delete CloudWatch Alarms
echo ""
echo "🗑️  Deleting CloudWatch Alarms..."
ALARMS=$(aws cloudwatch describe-alarms \
    --region $AWS_REGION \
    --query 'MetricAlarms[?contains(AlarmName, `scout`) || contains(AlarmName, `aligno`)].AlarmName' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ALARMS" ]; then
    for ALARM_NAME in $ALARMS; do
        echo "   Deleting alarm: $ALARM_NAME"
        aws cloudwatch delete-alarms \
            --alarm-names $ALARM_NAME \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete alarm"
    done
    echo "✅ CloudWatch alarms deleted"
else
    echo "   No CloudWatch alarms found"
fi

# 10. Delete Secrets Manager secrets
echo ""
echo "🗑️  Deleting Secrets Manager secrets..."

# Scout/Aligno related secrets
SECRETS=$(aws secretsmanager list-secrets \
    --region $AWS_REGION \
    --query 'SecretList[?contains(Name, `scout`) || contains(Name, `aligno`)].Name' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SECRETS" ]; then
    for SECRET_NAME in $SECRETS; do
        echo "   Deleting scout/aligno secret: $SECRET_NAME"
        aws secretsmanager delete-secret \
            --secret-id $SECRET_NAME \
            --force-delete-without-recovery \
            --region $AWS_REGION 2>&1 >/dev/null && echo "   ✅ Deleted" || echo "   Failed to delete"
    done
    echo "✅ Scout/Aligno secrets deleted"
else
    echo "   No scout/aligno secrets found"
fi

# RDS related secrets (but keep aligno-db related ones)
RDS_SECRETS=$(aws secretsmanager list-secrets \
    --region $AWS_REGION \
    --query 'SecretList[?contains(Name, `rds`) && !contains(Name, `aligno-db`)].Name' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$RDS_SECRETS" ]; then
    for SECRET_NAME in $RDS_SECRETS; do
        echo "   Deleting RDS secret: $SECRET_NAME"
        aws secretsmanager delete-secret \
            --secret-id $SECRET_NAME \
            --force-delete-without-recovery \
            --region $AWS_REGION 2>&1 >/dev/null && echo "   ✅ Deleted" || echo "   Failed to delete"
    done
    echo "✅ RDS secrets deleted"
else
    echo "   No RDS secrets to delete"
fi

# 11. Delete IAM role policies and roles
echo ""
echo "🗑️  Deleting IAM roles and policies..."

# Delete EventBridge role (current: scout-eventbridge-role, legacy: scraper-eventbridge-role)
for ROLE_NAME in "scout-eventbridge-role" "scraper-eventbridge-role"; do
    POLICIES=$(aws iam list-role-policies \
        --role-name $ROLE_NAME \
        --region $AWS_REGION \
        --query 'PolicyNames[]' \
        --output text 2>/dev/null || echo "")

    if [ ! -z "$POLICIES" ]; then
        for POLICY in $POLICIES; do
            echo "   Deleting policy $POLICY from $ROLE_NAME"
            aws iam delete-role-policy \
                --role-name $ROLE_NAME \
                --policy-name $POLICY \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete policy"
        done
    fi

    aws iam delete-role \
        --role-name $ROLE_NAME \
        --region $AWS_REGION 2>&1 >/dev/null && echo "✅ EventBridge role $ROLE_NAME deleted" || true
done

# Delete task role policies (current: scout-task-role, legacy: scraper-task-role, aligno-scout-task-role)
for ROLE_NAME in "scout-task-role" "scraper-task-role" "aligno-scout-task-role"; do
    POLICIES=$(aws iam list-role-policies \
        --role-name $ROLE_NAME \
        --region $AWS_REGION \
        --query 'PolicyNames[]' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$POLICIES" ]; then
        for POLICY in $POLICIES; do
            echo "   Deleting policy $POLICY from $ROLE_NAME"
            aws iam delete-role-policy \
                --role-name $ROLE_NAME \
                --policy-name $POLICY \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete policy"
        done
    fi
    
    aws iam delete-role \
        --role-name $ROLE_NAME \
        --region $AWS_REGION 2>&1 >/dev/null && echo "✅ Task role $ROLE_NAME deleted" || true
done

# Delete execution role policies (current: scout-execution-role, legacy: scraper-execution-role, aligno-scout-execution-role)
for ROLE_NAME in "scout-execution-role" "scraper-execution-role" "aligno-scout-execution-role"; do
    POLICIES=$(aws iam list-role-policies \
        --role-name $ROLE_NAME \
        --region $AWS_REGION \
        --query 'PolicyNames[]' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$POLICIES" ]; then
        for POLICY in $POLICIES; do
            echo "   Deleting policy $POLICY from $ROLE_NAME"
            aws iam delete-role-policy \
                --role-name $ROLE_NAME \
                --policy-name $POLICY \
                --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete policy"
        done
    fi
    
    aws iam delete-role \
        --role-name $ROLE_NAME \
        --region $AWS_REGION 2>&1 >/dev/null && echo "✅ Execution role $ROLE_NAME deleted" || true
done

# 12. Clean up resources in default VPC
echo ""
echo "🔍 Cleaning up resources in default VPC..."

# Find default VPC
DEFAULT_VPC_ID=$(aws ec2 describe-vpcs \
    --region $AWS_REGION \
    --filters "Name=is-default,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$DEFAULT_VPC_ID" ] && [ "$DEFAULT_VPC_ID" != "None" ]; then
    echo "   Found default VPC: $DEFAULT_VPC_ID"
    
    # Delete custom security groups in default VPC
    echo ""
    echo "🗑️  Deleting custom security groups in default VPC..."
    CUSTOM_SGS=$(aws ec2 describe-security-groups \
        --region $AWS_REGION \
        --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" "Name=group-name,Values=scout-sg,scraper-sg" \
        --query 'SecurityGroups[].GroupId' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$CUSTOM_SGS" ]; then
        for SG_ID in $CUSTOM_SGS; do
            echo "   Deleting security group: $SG_ID"
            aws ec2 delete-security-group \
                --group-id $SG_ID \
                --region $AWS_REGION 2>&1 >/dev/null && echo "   ✅ Deleted" || echo "   Failed to delete (may be in use)"
        done
        echo "✅ Custom security groups processed"
    else
        echo "   No custom security groups to delete"
    fi
    
    # Delete network interfaces (if not in use by RDS)
    echo ""
    echo "🗑️  Checking network interfaces..."
    NETWORK_INTERFACES=$(aws ec2 describe-network-interfaces \
        --region $AWS_REGION \
        --filters "Name=vpc-id,Values=$DEFAULT_VPC_ID" \
        --query 'NetworkInterfaces[?Status==`available`].NetworkInterfaceId' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$NETWORK_INTERFACES" ]; then
        for ENI_ID in $NETWORK_INTERFACES; do
            echo "   Deleting network interface: $ENI_ID"
            aws ec2 delete-network-interface \
                --network-interface-id $ENI_ID \
                --region $AWS_REGION 2>&1 >/dev/null && echo "   ✅ Deleted" || echo "   Failed to delete (may be in use)"
        done
        echo "✅ Available network interfaces processed"
    else
        echo "   No available network interfaces to delete"
    fi
    
    # Check if Internet Gateway is only used by default VPC (safe to detach)
    echo ""
    echo "🗑️  Checking Internet Gateway..."
    IGW_ID=$(aws ec2 describe-internet-gateways \
        --region $AWS_REGION \
        --filters "Name=attachment.vpc-id,Values=$DEFAULT_VPC_ID" \
        --query 'InternetGateways[0].InternetGatewayId' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
        # Check if this IGW is attached to any other VPCs
        OTHER_VPCS=$(aws ec2 describe-internet-gateways \
            --region $AWS_REGION \
            --internet-gateway-ids $IGW_ID \
            --query 'InternetGateways[0].Attachments[?VpcId!=`'$DEFAULT_VPC_ID'`].VpcId' \
            --output text 2>/dev/null || echo "")
        
        if [ -z "$OTHER_VPCS" ] || [ "$OTHER_VPCS" == "None" ]; then
            echo "   Internet Gateway $IGW_ID is only attached to default VPC - leaving it alone"
        else
            echo "   Internet Gateway $IGW_ID is attached to other VPCs - leaving it alone"
        fi
    fi
    
else
    echo "   No default VPC found"
fi

# 13. Get custom VPC ID (by tag or name) - original logic
echo ""
echo "🔍 Finding custom VPC and networking resources..."
VPC_ID=$(aws ec2 describe-vpcs \
    --region $AWS_REGION \
    --filters "Name=cidr,Values=10.0.0.0/16" \
    --query 'Vpcs[0].VpcId' \
    --output text 2>/dev/null || echo "")

if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    echo "   No custom VPC found with CIDR 10.0.0.0/16"
    echo "✅ Cleanup completed!"
    exit 0
fi

echo "   Found custom VPC: $VPC_ID"

# 14. Delete NAT Gateways
echo ""
echo "🗑️  Deleting NAT Gateways..."
NAT_GATEWAYS=$(aws ec2 describe-nat-gateways \
    --region $AWS_REGION \
    --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=pending,available" \
    --query 'NatGateways[].NatGatewayId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$NAT_GATEWAYS" ]; then
    for NAT_ID in $NAT_GATEWAYS; do
        echo "   Deleting NAT Gateway: $NAT_ID"
        aws ec2 delete-nat-gateway \
            --nat-gateway-id $NAT_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "   ⏳ Waiting for NAT Gateways to be deleted (this may take a few minutes)..."
    sleep 30
    echo "✅ NAT Gateways deletion initiated"
else
    echo "   No NAT Gateways to delete"
fi

# 15. Release Elastic IPs
echo ""
echo "🗑️  Releasing Elastic IPs..."
ELASTIC_IPS=$(aws ec2 describe-addresses \
    --region $AWS_REGION \
    --query 'Addresses[].AllocationId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ELASTIC_IPS" ]; then
    for ALLOCATION_ID in $ELASTIC_IPS; do
        echo "   Releasing Elastic IP: $ALLOCATION_ID"
        aws ec2 release-address \
            --allocation-id $ALLOCATION_ID \
            --region $AWS_REGION 2>&1 >/dev/null && echo "   ✅ Released" || echo "   Failed to release (may still be in use)"
    done
    echo "✅ Elastic IPs processed"
else
    echo "   No Elastic IPs to release"
fi

# 16. Delete security groups (except default)
echo ""
echo "🗑️  Deleting security groups..."

# First, find all custom security groups (non-default)
SECURITY_GROUPS=$(aws ec2 describe-security-groups \
    --region $AWS_REGION \
    --query 'SecurityGroups[?GroupName!=`default` && (contains(GroupName, `scout`) || contains(GroupName, `aligno`))].GroupId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SECURITY_GROUPS" ]; then
    for SG_ID in $SECURITY_GROUPS; do
        echo "   Processing security group: $SG_ID"
        
        # Remove all ingress rules from other SGs that reference this SG
        echo "     Checking for references in other security groups..."
        aws ec2 describe-security-groups \
            --region $AWS_REGION \
            --output json 2>/dev/null | jq -r --arg sg "$SG_ID" \
            '.SecurityGroups[] | select(.IpPermissions[].UserIdGroupPairs[]?.GroupId == $sg or .IpPermissionsEgress[].UserIdGroupPairs[]?.GroupId == $sg) | .GroupId' | \
        while read REFERENCING_SG; do
            if [ ! -z "$REFERENCING_SG" ]; then
                echo "     Removing references from $REFERENCING_SG..."
                # Get the rules that reference our SG
                aws ec2 describe-security-groups \
                    --group-ids $REFERENCING_SG \
                    --region $AWS_REGION \
                    --output json 2>/dev/null | jq -r --arg sg "$SG_ID" \
                    '.SecurityGroups[].IpPermissions[] | select(.UserIdGroupPairs[]?.GroupId == $sg) | @json' | \
                while read RULE; do
                    if [ ! -z "$RULE" ]; then
                        aws ec2 revoke-security-group-ingress \
                            --group-id $REFERENCING_SG \
                            --region $AWS_REGION \
                            --ip-permissions "$RULE" 2>&1 >/dev/null || true
                    fi
                done
            fi
        done
        
        echo "     Deleting security group: $SG_ID"
        aws ec2 delete-security-group \
            --group-id $SG_ID \
            --region $AWS_REGION 2>&1 >/dev/null && echo "     ✅ Deleted" || echo "     Failed to delete"
    done
    echo "✅ Security groups processed"
else
    echo "   No custom security groups to delete"
fi

# 17. Delete subnets
echo ""
echo "🗑️  Deleting subnets..."
SUBNETS=$(aws ec2 describe-subnets \
    --region $AWS_REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].SubnetId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$SUBNETS" ]; then
    for SUBNET_ID in $SUBNETS; do
        echo "   Deleting subnet: $SUBNET_ID"
        aws ec2 delete-subnet \
            --subnet-id $SUBNET_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Subnets deleted"
else
    echo "   No subnets to delete"
fi

# 18. Delete route tables (except main)
echo ""
echo "🗑️  Deleting route tables..."
ROUTE_TABLES=$(aws ec2 describe-route-tables \
    --region $AWS_REGION \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$ROUTE_TABLES" ]; then
    for RT_ID in $ROUTE_TABLES; do
        echo "   Deleting route table: $RT_ID"
        aws ec2 delete-route-table \
            --route-table-id $RT_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Route tables deleted"
else
    echo "   No route tables to delete"
fi

# 19. Detach and delete Internet Gateways
echo ""
echo "🗑️  Deleting Internet Gateways..."
IGW_IDS=$(aws ec2 describe-internet-gateways \
    --region $AWS_REGION \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --query 'InternetGateways[].InternetGatewayId' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$IGW_IDS" ]; then
    for IGW_ID in $IGW_IDS; do
        echo "   Detaching Internet Gateway: $IGW_ID"
        aws ec2 detach-internet-gateway \
            --internet-gateway-id $IGW_ID \
            --vpc-id $VPC_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to detach"
        
        echo "   Deleting Internet Gateway: $IGW_ID"
        aws ec2 delete-internet-gateway \
            --internet-gateway-id $IGW_ID \
            --region $AWS_REGION 2>&1 >/dev/null || echo "   Failed to delete"
    done
    echo "✅ Internet Gateways deleted"
else
    echo "   No Internet Gateways to delete"
fi

# 20. Delete VPC
echo ""
echo "🗑️  Deleting VPC..."
aws ec2 delete-vpc \
    --vpc-id $VPC_ID \
    --region $AWS_REGION 2>&1 && echo "✅ VPC deleted" || echo "   Failed to delete VPC (may still have dependencies)"

echo ""
echo "✅ Cleanup completed!"
echo "📋 RDS database has been preserved"
echo ""
echo "💡 Note: If some resources couldn't be deleted, they may still be in use."
echo "   Wait a few minutes and run this script again."

