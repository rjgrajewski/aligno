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
    """Lambda handler. Run normalization once (no --clear)."""
    stage = (event or {}).get("stage", "all")
    clear_first = (event or {}).get("clear_first", False)
    if not os.environ.get("DATABASE_URL") and not os.environ.get("AWS_DB_ENDPOINT"):
        raise ValueError("Set DATABASE_URL or AWS_DB_* env vars for Lambda")
    asyncio.run(run_normalization_process(stage=stage, clear_first=clear_first))
    return {"statusCode": 200, "body": "Normalization completed"}
