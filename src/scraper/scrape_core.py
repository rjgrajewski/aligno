# scrape_core.py
import asyncio
import re
from playwright.async_api import async_playwright, Browser, Page
import logging

def sanitize_string(value, max_length=None):
    """Simple string sanitization without validation."""
    if not value or not isinstance(value, str):
        return None
    # Basic cleanup
    cleaned = value.strip()
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
    return cleaned if cleaned else None

SCROLL_PAUSE = 0.512
SCROLL_STEP = None

async def init_browser(headless: bool = True):
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=headless)
    page = await browser.new_page()
    return playwright, browser, page

async def collect_offer_links(page: Page, max_links: int = None) -> list[str]:
    """
    Collects job offer links from JustJoin.it by scrolling through the page.
    
    Args:
        page: Playwright page object
        max_links: Maximum number of links to collect (None for no limit)
    
    Returns:
        list[str]: List of job offer URLs
    """
    unique_urls = set()
    idle_count = 0
    max_idle = 3  # Reduced to 3 for faster testing
    scroll_count = 0
    
    logging.info("🔄 Starting to collect job offer links...")
    
    # Wait for page to load initially
    await asyncio.sleep(3)
    
    while scroll_count < 10:  # Limit total scrolls for safety
        scroll_count += 1
        logging.info(f"📊 Scroll {scroll_count}/10")
        
        # Get current links and extract URLs
        try:
            # Wait a bit for content to load
            await asyncio.sleep(2)
            
            current_links = await page.locator('a[href*="/job-offer/"]').all()
            current_urls = set()
            
            logging.info(f"🔍 Found {len(current_links)} link elements")
            
            for i, link in enumerate(current_links):
                try:
                    href = await link.get_attribute('href', timeout=2000)  # 2 second timeout
                    if href and '/job-offer/' in href:
                        if href.startswith('/'):
                            href = f"https://justjoin.it{href}"
                        current_urls.add(href)
                        if len(current_urls) <= 5:  # Log first few URLs
                            logging.info(f"  📎 {len(current_urls)}: {href}")
                except Exception as e:
                    # Skip this link and continue
                    continue
                    
        except Exception as e:
            logging.warning(f"⚠️ Error getting links: {e}")
            current_urls = set()
        
        # Add new URLs to our collection
        new_urls = current_urls - unique_urls
        unique_urls.update(current_urls)
        
        logging.info(f"📊 Scroll {scroll_count}: Found {len(current_urls)} links on page, {len(unique_urls)} unique total")
        
        if new_urls:
            logging.info(f"✅ Found {len(new_urls)} new unique links")
            idle_count = 0
        else:
            idle_count += 1
            logging.info(f"⏸️ No new links found (idle {idle_count}/{max_idle})")
            
            if idle_count >= max_idle:
                logging.info("🛑 Stopping - no new links found for 3 consecutive scrolls")
                break
        
        # Check if we've reached the limit
        if max_links and len(unique_urls) >= max_links:
            logging.info(f"✅ Reached maximum links limit: {max_links}")
            break
            
        # Scroll down
        logging.info("⬇️ Scrolling down...")
        await page.evaluate("window.scrollBy(0, window.innerHeight)")
        await asyncio.sleep(SCROLL_PAUSE)
    
    offer_urls = list(unique_urls)
    logging.info(f"✅ Collected {len(offer_urls)} unique job offer links")
    return offer_urls

async def process_offers(page: Page, conn, offer_urls: list[str], max_offers: int = None) -> int:
    """
    Process job offers and save them to the database.
    
    Args:
        page: Playwright page object
        conn: Database connection
        offer_urls: List of job offer URLs to process
        max_offers: Maximum number of offers to process (None for no limit)
    
    Returns:
        int: Number of offers processed
    """
    if max_offers:
        offer_urls = offer_urls[:max_offers]
        logging.info(f"🎯 Processing limited to {max_offers} offers")
    
    # Get existing URLs to avoid duplicates
    existing_urls = set()
    try:
        existing_records = await conn.fetch("SELECT job_url FROM offers")
        existing_urls = {record['job_url'] for record in existing_records}
        logging.info(f"📊 Found {len(existing_urls)} existing offers in database")
    except Exception as e:
        logging.warning(f"⚠️ Could not fetch existing URLs: {e}")
    
    processed_count = 0
    
    for i, href in enumerate(offer_urls, 1):
        try:
            logging.info(f"🔄 Processing offer {i}/{len(offer_urls)}: {href}")
            
            # Navigate to the offer page
            await page.goto(href, wait_until='networkidle', timeout=30000)
            
            # Wait for the page to load
            await asyncio.sleep(1)
            
            # Extract job details
            job_url = href
            
            # Job title
            job_title = None
            try:
                title_element = page.locator('h1').first
                if await title_element.count() > 0:
                    job_title = await title_element.inner_text()
            except Exception:
                pass
            
            # Category - use the specific XPath selector
            category = None
            try:
                category_element = page.locator('xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[2]/div[1]/div').first
                if await category_element.count() > 0:
                    category = await category_element.inner_text()
            except Exception:
                pass
            
            # Company - use the specific XPath selector
            company = None
            try:
                company_element = page.locator('xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[2]/div[2]/a/p').first
                if await company_element.count() > 0:
                    company = await company_element.inner_text()
            except Exception:
                pass
            
            # Location - use the specific XPath selector
            location = None
            try:
                location_element = page.locator('xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[2]/div/div/nav/ol/li[3]/a').first
                if await location_element.count() > 0:
                    location = await location_element.inner_text()
            except Exception:
                pass
            
            # Salary information - simple and effective approach
            salary_any = None
            salary_b2b = None
            salary_internship = None
            salary_mandate = None
            salary_perm = None
            salary_specific_task = None
            
            try:
                # Step 1: Find the div containing salary information
                salary_container = page.locator('span:has-text("Salary")').first
                
                if await salary_container.count() > 0:
                    # Step 2: Get all salary variants within the salary section
                    # Look for the parent container that holds all salary variants
                    parent_container = salary_container.locator('xpath=following-sibling::div[contains(@class,"mui-14zr2vc")]').first
                    
                    if await parent_container.count() > 0:
                        # Find all individual salary blocks within this container
                        salary_blocks = await parent_container.locator('xpath=.//div[contains(@class,"mui-1bzxsz6")]').all()
                        
                        print(f"🔍 Found {len(salary_blocks)} salary blocks")
                        
                        # Step 3: Process each salary variant
                        for i, block in enumerate(salary_blocks):
                            try:
                                print(f"  🔍 Processing salary block {i+1}")
                                
                                # Get all text content from this block and parse it
                                block_text = await block.inner_text()
                                print(f"    📄 Block text: '{block_text}'")
                                
                                # Try to extract amount and type from the block text
                                # Look for patterns like "20 000 PLN Net per month - B2B"
                                import re
                                
                                # Pattern to match salary with amount, currency, and type
                                salary_pattern = r'(\d+[\s,]?\d+)\s*(PLN|USD|EUR)\s*([^-]+)\s*-\s*([^-\n]+)'
                                matches = re.findall(salary_pattern, block_text)
                                
                                if matches:
                                    for match in matches:
                                        amount = match[0].strip()
                                        currency = match[1].strip()
                                        description = match[2].strip()
                                        salary_type = match[3].strip()
                                        
                                        salary_full = f"{amount} {currency} {description} - {salary_type}"
                                        print(f"  💰 Salary variant {i+1}: {salary_full}")
                                        
                                        # Step 3: Assign to column based on what's after the hyphen
                                        if 'B2B' in salary_type:
                                            salary_b2b = salary_full
                                            print(f"    ✅ Assigned to salary_b2b")
                                        elif 'Permanent' in salary_type:
                                            salary_perm = salary_full
                                            print(f"    ✅ Assigned to salary_perm")
                                        elif 'Internship' in salary_type:
                                            salary_internship = salary_full
                                            print(f"    ✅ Assigned to salary_internship")
                                        elif 'Mandate' in salary_type or 'Umowa zlecenie' in salary_type:
                                            salary_mandate = salary_full
                                            print(f"    ✅ Assigned to salary_mandate")
                                        else:
                                            salary_any = salary_full
                                            print(f"    ✅ Assigned to salary_any")
                                else:
                                    # Fallback: try to extract the full range and look for type elsewhere
                                    amount_range_match = re.search(r'(\d+[\s,]?\d+\s*-\s*\d+[\s,]?\d+)\s*(PLN|USD|EUR)', block_text)
                                    if amount_range_match:
                                        amount_range = amount_range_match.group(1).strip()
                                        currency = amount_range_match.group(2).strip()
                                        print(f"    💰 Found amount range: {amount_range} {currency}")
                                        
                                        # Look for type indicators in the text
                                        if 'B2B' in block_text:
                                            salary_b2b = f"{amount_range} {currency} - B2B"
                                            print(f"    ✅ Assigned to salary_b2b")
                                        elif 'Permanent' in block_text:
                                            salary_perm = f"{amount_range} {currency} - Permanent"
                                            print(f"    ✅ Assigned to salary_perm")
                                        else:
                                            salary_any = f"{amount_range} {currency}"
                                            print(f"    ✅ Assigned to salary_any")
                                    else:
                                        print(f"    ❌ No salary pattern found in block {i+1}")
                                    
                            except Exception as e:
                                print(f"    ❌ Error processing salary block {i+1}: {e}")
                                continue
                                
            except Exception as e:
                print(f"❌ Error in salary extraction: {e}")
                pass
            
            # Work type - use the specific XPath selector
            work_type = None
            try:
                work_type_element = page.locator('xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[3]/div[1]/div[2]').first
                if await work_type_element.count() > 0:
                    work_type = await work_type_element.inner_text()
            except Exception:
                pass
            
            # Experience - use the specific XPath selector
            experience = None
            try:
                experience_element = page.locator('xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[3]/div[3]/div[2]').first
                if await experience_element.count() > 0:
                    experience = await experience_element.inner_text()
            except Exception:
                pass
            
            # Employment type - use the specific XPath selector
            employment_type = None
            try:
                employment_element = page.locator('xpath=/html/body/div[2]/div/div[1]/div[4]/div/div[3]/div[1]/div[1]/div[3]/div[2]/div[2]').first
                if await employment_element.count() > 0:
                    employment_type = await employment_element.inner_text()
            except Exception:
                pass
            
            # Operating mode - already determined in location
            operating_mode = None
            try:
                if location == 'Remote':
                    operating_mode = 'Remote'
                elif location == 'Hybrid':
                    operating_mode = 'Hybrid'
                elif location and location not in ['Remote', 'Hybrid']:
                    operating_mode = 'Office'
            except Exception:
                pass
            
            # Tech stack - try multiple approaches to find tech items
            tech_stack = {}
            try:
                # Approach 1: Look for h4 elements that might be tech names
                tech_names = await page.locator('h4').all()
                for name_elem in tech_names:
                    try:
                        name_text = await name_elem.inner_text()
                        if name_text and name_text.strip():
                            # Look for span element in the same parent
                            parent = name_elem.locator('..')
                            span_elem = parent.locator('span').first
                            if await span_elem.count() > 0:
                                level_text = await span_elem.inner_text()
                                if level_text and level_text.strip():
                                    tech_stack[name_text.strip()] = level_text.strip()
                    except:
                        continue
                        
                # If no tech found, try approach 2: look for specific patterns
                if not tech_stack:
                    # Look for elements that contain both h4 and span
                    tech_containers = page.locator('div').all()
                    for container in tech_containers[:20]:  # Limit to first 20
                        try:
                            h4_elem = container.locator('h4').first
                            span_elem = container.locator('span').first
                            
                            if await h4_elem.count() > 0 and await span_elem.count() > 0:
                                name = await h4_elem.inner_text()
                                level = await span_elem.inner_text()
                                
                                if name and level and name.strip() and level.strip():
                                    # Skip if it looks like a tech stack item
                                    if len(name) < 50 and len(level) < 20:
                                        tech_stack[name.strip()] = level.strip()
                        except:
                            continue
            except Exception:
                pass
            
            # Prepare offer data
            tech_stack_formatted = "; ".join(
                f"{name}: {level}" for name, level in tech_stack.items()
            )
            
            # Debug: Log extracted data
            logging.info(f"📊 Extracted data for {job_title}:")
            logging.info(f"  Company: {company}")
            logging.info(f"  Location: {location}")
            logging.info(f"  Salary B2B: {salary_b2b}")
            logging.info(f"  Salary Permanent: {salary_perm}")
            logging.info(f"  Salary Other: {salary_any}")
            logging.info(f"  Tech Stack: {tech_stack_formatted}")
            
            # Sanitize and prepare offer data
            offer_data = {
                "job_url": sanitize_string(job_url),
                "job_title": sanitize_string(job_title),
                "category": sanitize_string(category),
                "company": sanitize_string(company),
                "location": sanitize_string(location),
                "salary_any": sanitize_string(salary_any),
                "salary_b2b": sanitize_string(salary_b2b),
                "salary_internship": sanitize_string(salary_internship),
                "salary_mandate": sanitize_string(salary_mandate),
                "salary_perm": sanitize_string(salary_perm),
                "salary_specific_task": sanitize_string(salary_specific_task),
                "work_type": sanitize_string(work_type),
                "experience": sanitize_string(experience),
                "employment_type": sanitize_string(employment_type),
                "operating_mode": sanitize_string(operating_mode),
                "tech_stack": sanitize_string(tech_stack_formatted)
            }
            
            # Log offer data
            logging.info(f"{i}: {offer_data.get('job_title', 'Unknown title')}")
            
            # Save to database immediately if it's a new offer
            if job_url not in existing_urls:
                try:
                    await conn.execute(
                        """
                        INSERT INTO offers (job_url, job_title, category, company, location, salary_any, salary_b2b, salary_internship, salary_mandate, salary_perm, salary_specific_task, work_type, experience, employment_type, operating_mode, tech_stack)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
                        ON CONFLICT (job_url) DO NOTHING
                        """,
                        offer_data["job_url"], offer_data["job_title"], offer_data["category"], 
                        offer_data["company"], offer_data["location"], offer_data["salary_any"], 
                        offer_data["salary_b2b"], offer_data["salary_internship"], offer_data["salary_mandate"], 
                        offer_data["salary_perm"], offer_data["salary_specific_task"], offer_data["work_type"], 
                        offer_data["experience"], offer_data["employment_type"], offer_data["operating_mode"], 
                        offer_data["tech_stack"]
                    )
                    existing_urls.add(job_url)
                    processed_count += 1
                    if processed_count % 10 == 0:  # Log progress every 10 offers
                        logging.info(f"✅ Saved {processed_count} offers to database")
                except Exception as db_error:
                    logging.error(f"Database error saving offer {job_url}: {db_error}")
                    # If it's a connection error, we'll let the caller handle reconnection
                    if "connection is closed" in str(db_error).lower():
                        raise db_error
                        
        except Exception as e:
            logging.error(f"Error processing job offer {href}: {e}")
        finally:
            # Small delay between requests to be respectful
            await asyncio.sleep(0.5)
    
    logging.info(f"✅ Processed {processed_count} new offers")
    return processed_count