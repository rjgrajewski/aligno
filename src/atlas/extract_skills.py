#!/usr/bin/env python3
"""
Extract unique skills from offers and populate the skills table.

This script:
1. Reads all tech_stack values from the offers table
2. Parses and extracts individual skills
3. Inserts unique skills into the skills table
"""

import asyncio
import asyncpg
import logging
import sys
from pathlib import Path
from dotenv import load_dotenv

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


async def init_skills_table(conn: asyncpg.Connection):
    """
    Initialize the skills table if it doesn't exist.
    
    Args:
        conn: Database connection
    """
    schema_path = Path(__file__).parent.parent / "sql" / "tables" / "skills.sql"
    if schema_path.exists():
        ddl = schema_path.read_text()
        await conn.execute(ddl)
        logging.info("✅ Skills table initialized")
    else:
        logging.warning(f"⚠️ Skills schema file not found: {schema_path}")


async def extract_skills_from_tech_stack(tech_stack: str) -> list[str]:
    """
    Parse tech_stack string and extract individual skills.
    
    The tech_stack field may contain comma-separated values, semicolon-separated,
    or other formats. This function normalizes and extracts individual skills.
    Removes skill levels (e.g., "Python: Advanced" -> "Python")
    
    Args:
        tech_stack: Raw tech_stack string from offers table
        
    Returns:
        List of individual skill names (without proficiency levels)
    """
    if not tech_stack:
        return []
    
    # Split by semicolon and newline (NOT comma, as it's often part of skill names)
    separators = [';', '\n']
    skills = [tech_stack]
    
    for separator in separators:
        new_skills = []
        for skill in skills:
            new_skills.extend(skill.split(separator))
        skills = new_skills
    
    # Clean up: strip whitespace, remove empty strings, remove proficiency levels
    cleaned_skills = []
    for skill in skills:
        skill = skill.strip()
        
        # Remove proficiency level (everything after colon)
        if ':' in skill:
            skill = skill.split(':')[0].strip()
        
        if skill:  # Only add non-empty skills
            cleaned_skills.append(skill)
    
    return cleaned_skills


async def get_all_tech_stacks(conn: asyncpg.Connection) -> list[str]:
    """
    Fetch all tech_stack values from offers table.
    
    Args:
        conn: Database connection
        
    Returns:
        List of tech_stack strings
    """
    query = """
        SELECT tech_stack 
        FROM offers 
        WHERE tech_stack IS NOT NULL AND tech_stack != ''
    """
    rows = await conn.fetch(query)
    return [row['tech_stack'] for row in rows]


async def insert_skills(conn: asyncpg.Connection, skills: set[str]):
    """
    Insert unique skills into the skills table.
    Uses ON CONFLICT to ignore duplicates.
    
    Args:
        conn: Database connection
        skills: Set of unique skill names
    """
    if not skills:
        logging.info("No skills to insert")
        return
    
    # Insert skills one by one (or use batch insert)
    insert_query = """
        INSERT INTO skills (original_skill_name)
        VALUES ($1)
        ON CONFLICT (original_skill_name) DO NOTHING
    """
    
    inserted_count = 0
    for skill in skills:
        try:
            await conn.execute(insert_query, skill)
            inserted_count += 1
        except Exception as e:
            logging.warning(f"Failed to insert skill '{skill}': {e}")
    
    logging.info(f"✅ Inserted {inserted_count} new unique skills")


async def clear_skills_table(conn: asyncpg.Connection):
    """
    Clear all data from the skills table.
    
    Args:
        conn: Database connection
    """
    try:
        await conn.execute("TRUNCATE TABLE skills RESTART IDENTITY")
        logging.info("🗑️ Skills table cleared")
    except Exception as e:
        logging.error(f"❌ Error clearing skills table: {e}")
        raise


async def extract_and_populate_skills(clear_existing: bool = False):
    """
    Main function to extract skills from offers and populate skills table.
    
    Args:
        clear_existing: If True, clears the skills table before extracting
    """
    logging.info("🚀 Starting skills extraction process...")
    
    # Connect to database
    dsn = get_database_dsn()
    conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
    logging.info("✅ Database connection established")
    
    try:
        # Initialize skills table
        await init_skills_table(conn)
        
        # Clear existing data if requested
        if clear_existing:
            await clear_skills_table(conn)
        
        # Get all tech_stack values
        logging.info("📊 Fetching tech_stack data from offers...")
        tech_stacks = await get_all_tech_stacks(conn)
        logging.info(f"Found {len(tech_stacks)} offers with tech_stack data")
        
        # Extract individual skills
        logging.info("🔍 Extracting individual skills...")
        all_skills = set()
        for tech_stack in tech_stacks:
            skills = await extract_skills_from_tech_stack(tech_stack)
            all_skills.update(skills)
        
        logging.info(f"Found {len(all_skills)} unique skills")
        
        # Insert skills into database
        logging.info("💾 Inserting skills into database...")
        await insert_skills(conn, all_skills)
        
        # Show statistics
        total_skills = await conn.fetchval("SELECT COUNT(*) FROM skills")
        logging.info(f"✅ Total skills in database: {total_skills}")
        
    except Exception as e:
        logging.error(f"❌ Error during skills extraction: {e}")
        raise
    finally:
        await conn.close()
        logging.info("🔌 Database connection closed")


async def show_sample_skills(limit: int = 20):
    """
    Display a sample of extracted skills for verification.
    
    Args:
        limit: Number of skills to display
    """
    logging.info(f"\n📋 Sample of extracted skills (first {limit}):")
    
    dsn = get_database_dsn()
    conn = await asyncpg.connect(dsn=dsn, command_timeout=60)
    
    try:
        query = """
            SELECT id, original_skill_name, created_at
            FROM skills
            ORDER BY id
            LIMIT $1
        """
        rows = await conn.fetch(query, limit)
        
        for row in rows:
            logging.info(f"  {row['id']:4d} | {row['original_skill_name']}")
            
    finally:
        await conn.close()


def main():
    """CLI entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract skills from offers to skills table')
    parser.add_argument('--sample', action='store_true', help='Show sample of extracted skills')
    parser.add_argument('--limit', type=int, default=20, help='Number of samples to show (default: 20)')
    parser.add_argument('--clear', action='store_true', help='Clear existing skills before extracting')
    
    args = parser.parse_args()
    
    if args.sample:
        asyncio.run(show_sample_skills(args.limit))
    else:
        asyncio.run(extract_and_populate_skills(clear_existing=args.clear))


if __name__ == "__main__":
    main()

