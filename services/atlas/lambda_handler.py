"""
Lambda entry point for skill normalization.
Runs full normalization (extract → normalize → deduplicate → link).
Uses IAM role for Bedrock; DATABASE_URL (or AWS_DB_*) and AWS_REGION from env.
"""
import asyncio
import logging
import os

from .normalize_skills import run_normalization_process

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def handler(event=None, context=None):
    """Lambda handler. Run normalization once; clear_first is forbidden here."""
    event = event or {}
    stage = event.get("stage", "all")
    if event.get("clear_first"):
        raise ValueError("clear_first is not allowed in Lambda prod environment")
    if not any(os.environ.get(k) for k in ["DATABASE_URL", "AWS_DB_ENDPOINT", "SECRET_ARN"]):
        raise ValueError("Set DATABASE_URL, AWS_DB_*, or SECRET_ARN env var for Lambda")
    asyncio.run(run_normalization_process(stage=stage, clear_first=False))
    return {"statusCode": 200, "body": "Normalization completed"}
