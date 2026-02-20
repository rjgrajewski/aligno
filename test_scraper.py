import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from src.scout.scrape_core import init_browser, collect_offer_links, process_offers
from src.scout.config import ScrapingConfig
import asyncpg

async def main():
    print("Testing Scraper...")
    
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        dsn = f"postgresql://{os.getenv('AWS_DB_USERNAME')}:{os.getenv('AWS_DB_PASSWORD')}@{os.getenv('AWS_DB_ENDPOINT')}:5432/{os.getenv('AWS_DB_NAME')}?sslmode=require"
        
    conn = await asyncpg.connect(dsn)
    print("DB connection successful.")
    
    playwright, browser, page = await init_browser(headless=True)
    
    try:
        ScrapingConfig.MAX_IDLE_SCROLLS = 1 # make link collecting fast
        
        print("Fetching offers...")
        await page.goto("https://justjoin.it/?q=python")
        offer_urls = await collect_offer_links(page)
        
        print(f"Collected {len(offer_urls)} URLs. Processing at most 1...")
        test_urls = offer_urls[:1]
        
        # we will process and it might skip if already in DB, but it's fine.
        await process_offers(page, conn, test_urls, browser, playwright)
        print("Scraper test done!")
    finally:
        await browser.close()
        await playwright.stop()
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
