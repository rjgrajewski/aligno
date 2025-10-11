#!/usr/bin/env python3
"""
Categorize skills using AWS Bedrock (Claude).

This script:
1. Fetches skills without categories from the database
2. Uses AWS Bedrock Claude to categorize them in batches
3. Updates the database with the categorized skills
"""

import asyncio
import asyncpg
import logging
import sys
import os
import json
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv
import boto3

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add parent directory to path to import scout modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from scout.db import get_database_dsn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Skill categories
CATEGORIES = [
    "Programming Language",
    "Framework/Library",
    "Database",
    "Cloud Platform",
    "DevOps/CI-CD",
    "Operating System",
    "Testing Tool",
    "Version Control",
    "Web Technology",
    "Mobile Development",
    "Data Science/ML",
    "Networking",
    "Security",
    "Methodology/Practice",
    "Business Tool",
    "Language Skill",
    "Soft Skill",
    "Other"
]


async def add_category_column(conn: asyncpg.Connection):
    """
    Add category column to skills table if it doesn't exist.
    
    Args:
        conn: Database connection
    """
    try:
        await conn.execute("""
            ALTER TABLE skills 
            ADD COLUMN IF NOT EXISTS category TEXT
        """)
        
        # Create index if it doesn't exist
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category)
        """)
        
        logging.info("✅ Category column ensured in skills table")
    except Exception as e:
        logging.error(f"❌ Error adding category column: {e}")
        raise


async def get_uncategorized_skills(conn: asyncpg.Connection, limit: int = None) -> List[Dict]:
    """
    Fetch skills without categories.
    
    Args:
        conn: Database connection
        limit: Maximum number of skills to fetch
        
    Returns:
        List of skill dictionaries with id and original_skill_name
    """
    query = """
        SELECT id, original_skill_name
        FROM skills
        WHERE category IS NULL
        ORDER BY id
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    rows = await conn.fetch(query)
    return [{"id": row["id"], "name": row["original_skill_name"]} for row in rows]


def categorize_skills_with_ai(skills: List[Dict], bedrock_client) -> Dict[int, str]:
    """
    Categorize a batch of skills using AWS Bedrock Claude.
    
    Args:
        skills: List of skill dictionaries with id and name
        bedrock_client: Boto3 Bedrock Runtime client
        
    Returns:
        Dictionary mapping skill_id to category
    """
    if not skills:
        return {}
    
    # Prepare the prompt
    skill_list = "\n".join([f"{skill['id']}. {skill['name']}" for skill in skills])
    
    categories_str = ", ".join(CATEGORIES)
    
    prompt = f"""You are a technical skills categorization expert. Categorize each skill into ONE of these categories:

{categories_str}

Rules:
- Choose the MOST SPECIFIC category that fits
- Return ONLY the skill ID and category, one per line
- Format: ID:Category
- Be consistent (e.g., all React-related should be Framework/Library)
- Language skills like English, Spanish = "Language Skill"
- Communication, Leadership = "Soft Skill"

Skills to categorize:
{skill_list}

Return format example:
1:Programming Language
2:Framework/Library
3:Database
"""

    try:
        # Prepare request for Claude 3.5 Sonnet
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 2000,
            "temperature": 0.3,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "system": "You are a technical skills categorization expert. Return only ID:Category pairs, one per line."
        }
        
        # Call Bedrock
        # Use inference profile IDs (required for Claude 4.5 and newer models)
        model_ids = [
            "eu.anthropic.claude-sonnet-4-5-20250929-v1:0",  # Claude 4.5 via EU inference profile
            "global.anthropic.claude-sonnet-4-5-20250929-v1:0",  # Claude 4.5 via global inference profile
            "eu.anthropic.claude-3-7-sonnet-20250219-v1:0",  # Claude 3.7 Sonnet (fallback)
            "eu.anthropic.claude-3-5-sonnet-20240620-v1:0",  # Claude 3.5 Sonnet (fallback)
        ]
        
        response = None
        last_error = None
        
        for model_id in model_ids:
            try:
                response = bedrock_client.invoke_model(
                    modelId=model_id,
                    body=json.dumps(request_body)
                )
                logging.info(f"✅ Using model: {model_id}")
                break
            except Exception as e:
                last_error = e
                logging.debug(f"Failed to use {model_id}: {e}")
                continue
        
        if response is None:
            raise Exception(f"No valid model found. Last error: {last_error}")
        
        # Parse response
        response_body = json.loads(response['body'].read())
        result_text = response_body['content'][0]['text'].strip()
        
        # Parse the response
        categorized = {}
        for line in result_text.split('\n'):
            line = line.strip()
            if ':' in line:
                try:
                    skill_id_str, category = line.split(':', 1)
                    skill_id = int(skill_id_str.strip())
                    category = category.strip()
                    
                    # Validate category
                    if category in CATEGORIES:
                        categorized[skill_id] = category
                    else:
                        logging.warning(f"Invalid category '{category}' for skill ID {skill_id}, using 'Other'")
                        categorized[skill_id] = "Other"
                except ValueError:
                    logging.warning(f"Could not parse line: {line}")
                    continue
        
        return categorized
        
    except Exception as e:
        logging.error(f"❌ Error calling AWS Bedrock: {e}")
        return {}


async def update_skill_categories(conn: asyncpg.Connection, categorized: Dict[int, str]):
    """
    Update skills with their categories.
    
    Args:
        conn: Database connection
        categorized: Dictionary mapping skill_id to category
    """
    if not categorized:
        return
    
    update_query = """
        UPDATE skills
        SET category = $1
        WHERE id = $2
    """
    
    updated_count = 0
    for skill_id, category in categorized.items():
        try:
            await conn.execute(update_query, category, skill_id)
            updated_count += 1
        except Exception as e:
            logging.warning(f"Failed to update skill ID {skill_id}: {e}")
    
    logging.info(f"✅ Updated {updated_count} skills with categories")


async def categorize_all_skills(batch_size: int = 50, max_skills: int = None):
    """
    Main function to categorize all uncategorized skills.
    
    Args:
        batch_size: Number of skills to process per API call
        max_skills: Maximum total number of skills to process (None = all)
    """
    logging.info("🚀 Starting skills categorization process...")
    
    # Get AWS region
    aws_region = os.getenv('AWS_REGION', 'eu-central-1')
    logging.info(f"Using AWS region: {aws_region}")
    
    # Initialize Bedrock client
    try:
        bedrock_client = boto3.client(
            service_name='bedrock-runtime',
            region_name=aws_region
        )
        logging.info("✅ AWS Bedrock client initialized")
    except Exception as e:
        logging.error(f"❌ Failed to initialize Bedrock client: {e}")
        raise ValueError("Failed to connect to AWS Bedrock. Please check your AWS credentials.")
    
    # Connect to database
    dsn = get_database_dsn()
    conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
    logging.info("✅ Database connection established")
    
    try:
        # Ensure category column exists
        await add_category_column(conn)
        
        # Get uncategorized skills
        logging.info("📊 Fetching uncategorized skills...")
        all_skills = await get_uncategorized_skills(conn, limit=max_skills)
        total_skills = len(all_skills)
        logging.info(f"Found {total_skills} uncategorized skills")
        
        if total_skills == 0:
            logging.info("✅ All skills are already categorized!")
            return
        
        # Process in batches
        processed = 0
        for i in range(0, total_skills, batch_size):
            batch = all_skills[i:i + batch_size]
            batch_num = (i // batch_size) + 1
            total_batches = (total_skills + batch_size - 1) // batch_size
            
            logging.info(f"🔍 Processing batch {batch_num}/{total_batches} ({len(batch)} skills)...")
            
            # Categorize with AI
            categorized = categorize_skills_with_ai(batch, bedrock_client)
            
            # Update database
            await update_skill_categories(conn, categorized)
            
            processed += len(categorized)
            logging.info(f"Progress: {processed}/{total_skills} skills categorized ({processed*100//total_skills}%)")
            
            # Small delay to be nice to the API
            if i + batch_size < total_skills:
                await asyncio.sleep(1)
        
        # Show final statistics
        stats_query = """
            SELECT category, COUNT(*) as count
            FROM skills
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
        """
        stats = await conn.fetch(stats_query)
        
        logging.info("\n📊 Category distribution:")
        for row in stats:
            logging.info(f"  {row['category']:30s}: {row['count']:4d} skills")
        
        total_categorized = await conn.fetchval("SELECT COUNT(*) FROM skills WHERE category IS NOT NULL")
        total_all = await conn.fetchval("SELECT COUNT(*) FROM skills")
        logging.info(f"\n✅ Categorization complete: {total_categorized}/{total_all} skills categorized")
        
    except Exception as e:
        logging.error(f"❌ Error during categorization: {e}")
        raise
    finally:
        await conn.close()
        logging.info("🔌 Database connection closed")


async def show_category_stats():
    """
    Display statistics about categorized skills.
    """
    logging.info("📊 Category Statistics:")
    
    dsn = get_database_dsn()
    conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
    
    try:
        # Overall stats
        total = await conn.fetchval("SELECT COUNT(*) FROM skills")
        categorized = await conn.fetchval("SELECT COUNT(*) FROM skills WHERE category IS NOT NULL")
        uncategorized = total - categorized
        
        logging.info(f"\nTotal skills: {total}")
        logging.info(f"Categorized: {categorized} ({categorized*100//total if total > 0 else 0}%)")
        logging.info(f"Uncategorized: {uncategorized}")
        
        # Category breakdown
        stats_query = """
            SELECT category, COUNT(*) as count
            FROM skills
            WHERE category IS NOT NULL
            GROUP BY category
            ORDER BY count DESC
        """
        stats = await conn.fetch(stats_query)
        
        logging.info("\n📊 Breakdown by category:")
        for row in stats:
            logging.info(f"  {row['category']:30s}: {row['count']:4d} skills")
        
        # Sample from each category
        logging.info("\n📋 Sample skills from each category:")
        for row in stats[:5]:  # Top 5 categories
            category = row['category']
            samples = await conn.fetch("""
                SELECT original_skill_name
                FROM skills
                WHERE category = $1
                ORDER BY id
                LIMIT 3
            """, category)
            
            sample_names = [s['original_skill_name'] for s in samples]
            logging.info(f"\n  {category}:")
            for name in sample_names:
                logging.info(f"    - {name}")
            
    finally:
        await conn.close()


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Categorize skills using AWS Bedrock')
    parser.add_argument('--stats', action='store_true', help='Show category statistics')
    parser.add_argument('--batch-size', type=int, default=50, help='Number of skills per API call (default: 50)')
    parser.add_argument('--max-skills', type=int, help='Maximum number of skills to process (default: all)')
    
    args = parser.parse_args()
    
    if args.stats:
        asyncio.run(show_category_stats())
    else:
        asyncio.run(categorize_all_skills(
            batch_size=args.batch_size,
            max_skills=args.max_skills
        ))


if __name__ == "__main__":
    main()

