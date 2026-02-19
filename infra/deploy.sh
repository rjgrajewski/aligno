#!/usr/bin/env bash
# Deploy skill normalization Lambda (requires: sam, aws in PATH, and Docker for sam build --use-container).
# From repo root: ./infra/deploy.sh
# Requires .env file with AWS credentials – see infra/README.md.

set -e
cd "$(dirname "$0")/.."

if ! command -v sam &>/dev/null; then
  echo "SAM CLI not found. Install: brew install aws-sam-cli  or  pip install aws-sam-cli"
  exit 1
fi
if ! command -v aws &>/dev/null; then
  echo "AWS CLI not found. Install: https://aws.amazon.com/cli/"
  exit 1
fi

# Load .env – required (contains e.g. AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
if [ ! -f .env ]; then
  echo "No .env file. Create it in the repo root with AWS credentials (see infra/README.md)."
  exit 1
fi
set -a
source .env
set +a

# Export credentials for AWS CLI / SAM (from .env; fallback to AWS_BEDROCK_*)
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-$AWS_BEDROCK_ACCESS_KEY}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-$AWS_BEDROCK_SECRET_ACCESS_KEY}"
export AWS_SESSION_TOKEN="${AWS_SESSION_TOKEN:-}"
export AWS_REGION="${AWS_REGION:-eu-central-1}"

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "Set in .env: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY (or AWS_BEDROCK_ACCESS_KEY and AWS_BEDROCK_SECRET_ACCESS_KEY)."
  exit 1
fi

# DATABASE_URL: from .env or built from AWS_DB_*
if [ -n "$DATABASE_URL" ]; then
  :
elif [ -n "$AWS_DB_ENDPOINT" ] && [ -n "$AWS_DB_USERNAME" ] && [ -n "$AWS_DB_PASSWORD" ] && [ -n "$AWS_DB_NAME" ]; then
  PASS_ENC=$(python3 -c 'import urllib.parse, os; print(urllib.parse.quote(os.environ.get("AWS_DB_PASSWORD", ""), safe=""))')
  DATABASE_URL="postgresql://${AWS_DB_USERNAME}:${PASS_ENC}@${AWS_DB_ENDPOINT}:5432/${AWS_DB_NAME}"
else
  DATABASE_URL=""
fi
SCRAPER_ROLE_ARN="${SCRAPER_ROLE_ARN:-}"

# Build (layer with asyncpg requires Docker)
echo "Building..."
sam build -t infra/template.yaml --use-container

# Deploy parameters (we do not pass empty DatabaseUrl – template has default "")
PARAMS="AwsRegion=$AWS_REGION"
if [ -z "$DATABASE_URL" ]; then
  echo "Note: DATABASE_URL is not set in .env – after deploy set it in the Lambda configuration (env vars)."
else
  PARAMS="$PARAMS DatabaseUrl=$DATABASE_URL"
fi
[ -n "$SCRAPER_ROLE_ARN" ] && PARAMS="$PARAMS ScraperRoleArn=$SCRAPER_ROLE_ARN"

echo "Deploying (stack: aligno-normalize)..."
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name aligno-normalize \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides $PARAMS \
  --region "$AWS_REGION" \
  --resolve-s3

echo "Done. Set in Fargate (scraper) env: NORMALIZE_LAMBDA_NAME=aligno-normalize-skills"
