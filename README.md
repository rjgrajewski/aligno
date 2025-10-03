# Aligno: IT Job Search Engine
![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![asyncpg](https://img.shields.io/badge/asyncpg-0.29.0-blue) ![Playwright](https://img.shields.io/badge/playwright-1.52-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.3-blue) ![AWS](https://img.shields.io/badge/AWS-RDS-orange)

## 🚀 Overview

Aligno is a web application for collecting, processing and analyzing job offers from JustJoin.it. The main goals are:
1. Automatic retrieval and updating of the job offers database.
2. Presentation of market statistics via a dashboard.
3. Interactive job search based on user preferences and skills.
4. Generation of a personalized CV for a specific job posting.

## 📊 Current Status

- ✅ **JustJoin.it Scraper**: Fully implemented with Playwright
- ✅ **Database Schema**: Complete with offers table and processed view
- ✅ **AWS RDS Support**: Ready for production deployment
- ⏳ **Market Dashboard**: Planned
- ⏳ **Job Search API**: Planned
- ⏳ **CV Generation**: Planned

## 🔧 Key Features

1. **JustJoin.it Scraper**
   - Playwright-based scraper collecting job-offer links and details from JustJoin.it.
   - Updates PostgreSQL database by inserting new offers and purging stale ones.
   - **AWS RDS Ready**: Automatically detects and connects to AWS RDS databases.

2. **Market overview** (To do)
   - Presents market statistics via a dashboard.
   - Displays insights such as:
     - Number of job offers per month, technology, location etc.
     - Most popular technologies and skills.
     - Dependencies between salary and technology.

3. **Job search** (To do)
   - Allows users to search for job offers based on their skills and preferences.
   - Provides a personalized job search experience.
   - Displays job offers sorted by match to the user's skills and preferences.

4. **CV generation** (To do)
   - Generates a personalized CV for a specific job posting.
   - Allows users to customize their CV based on the job offer.
   - Provides an option to download the CV in various formats (PDF, DOCX, etc.).

## 📁 Repository Structure

```
Aligno/
├─ src/                                # Source code directory
│  ├─ sql/                             # SQL initialization scripts
│  │  ├─ 01_offers.sql                 # Job offers table definition
│  │  └─ 02_offers_processed_view.sql  # Processed offers view definition
│  └─ scraper/                         # Package for scraper functionality
│     ├─ __main__.py                   # Package API
│     ├─ cli.py                        # CLI module with argument parsing and orchestration
│     ├─ db.py                         # Database connection and schema management
│     └─ scrape_core.py                # Playwright browser init and scraping logic
├─ venv/                               # Virtual environment (included)
├─ .env.example                        # Environment variables template
├─ .gitignore                          # Git ignore rules
├─ .cursorignore                       # Cursor ignore rules
├─ requirements.txt                    # Python dependencies
├─ mypy.ini                            # Mypy configuration
└─ README.md                           # Project documentation
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Aligno
   ```

2. **Set up virtual environment:**
   ```bash
   # Virtual environment is already included in the project
   source venv/bin/activate  # On macOS/Linux
   # or
   venv\Scripts\activate     # On Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

5. **Run the scraper:**
   ```bash
   cd src
   ../venv/bin/python -m scraper
   ```

6. **Run API (when implemented):**
   ```bash
   cd src
   ../venv/bin/python -m api
   ```

## ⚙️ Configuration

Create a `.env` file in the root directory by copying from `.env.example` and updating with your actual values:

### 🏗️ **Database Configuration Options:**

#### **Option 1: AWS RDS (Recommended for production)**
```bash
# AWS RDS Configuration
AWS_DB_ENDPOINT=your-rds-endpoint.amazonaws.com
AWS_DB_NAME=aligno-db
AWS_DB_USERNAME=your_db_username
AWS_DB_PASSWORD=your_db_password
```

#### **Option 2: Local PostgreSQL Database**
```bash
# Local Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/aligno_db
# Alternative: individual database settings
DB_USER=aligno
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aligno_db
```

### 🎛️ **Scraper Configuration:**
```bash
HEADLESS=true  # Set to false for debugging (shows browser window)
BATCH_SIZE=500  # Batch size for database operations
SCROLL_PAUSE=0.512  # Pause between scrolls in seconds
MAX_IDLE=5  # Maximum idle scrolls before stopping
SCRAPER_TIMEOUT=30000  # Timeout for page operations in milliseconds
MAX_OFFERS=100  # Limit number of offers for debugging (None = no limit)
```

### 🤖 **OpenAI Configuration (for future AI features):**
```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=512
OPENAI_TEMPERATURE=0.0
```

### 🔒 Security Features

The application includes basic security measures:

- **SQL Injection Protection**: Database names are validated
- **Data Sanitization**: String inputs are cleaned before processing
- **Error Handling**: Robust error handling with proper logging
- **AWS RDS Integration**: Secure connection to cloud databases

### 🐛 Debugging & Development

For development and debugging purposes, you can limit the number of offers scraped:

```bash
# Limit to 50 offers for quick testing
MAX_OFFERS=50

# Or disable limit for full scraping
MAX_OFFERS=
```

**Debug Tips:**
- Set `HEADLESS=false` to see the browser window during scraping
- Use `MAX_OFFERS=10` for very quick testing
- Monitor logs for validation errors and data quality issues

### 🚨 Required Environment Variables

The following environment variables are **required**:
- Either `DATABASE_URL` OR `AWS_DB_ENDPOINT` with credentials OR `DB_PASSWORD` (if using individual DB settings)

### 📋 Optional Environment Variables

- `OPENAI_API_KEY`: Required for future AI-powered features (CV generation, skill matching)
- `HEADLESS`: Set to `false` for debugging (shows browser window during scraping)
- `MAX_OFFERS`: Limit number of offers for testing (leave empty for unlimited)

## 🌐 AWS RDS Setup

### **Prerequisites:**
1. AWS RDS PostgreSQL instance running
2. Security Group allowing inbound connections on port 5432
3. Database created with appropriate user permissions

### **Database Setup:**
1. Connect to your RDS instance and run the SQL scripts from `src/sql/`:
   ```sql
   -- Run 01_offers.sql to create the offers table
   -- Run 02_offers_processed_view.sql to create the view
   ```

2. Ensure your database user has the following permissions:
   - `CREATE TABLE`
   - `INSERT`, `UPDATE`, `DELETE` on the `offers` table
   - `SELECT` on all tables

### **Connection Testing:**
```bash
cd src
../venv/bin/python -c "
import asyncio
from scraper.db import init_db_connection

async def test():
    try:
        conn = await init_db_connection()
        print('✅ AWS RDS connection successful!')
        await conn.close()
    except Exception as e:
        print(f'❌ Connection failed: {e}')

asyncio.run(test())
"
```

## 📑 Code Highlights

- **src/scraper/** - scraper package:
   - `__main__.py`: Package API for the scraper
   - `cli.py`: CLI wrapper with environment checking and error handling
   - `db.py`: Handles asyncpg connection, database creation, inserts and purges with AWS RDS support
   - `scrape_core.py`: Contains browser initialization, scrolling, link collection, and offer parsing

- **src/sql/** - database schema:
   - `01_offers.sql`: Job offers table definition
   - `02_offers_processed_view.sql`: Processed offers view for analysis

## 📝 Future Improvements

**Market overview:**
   * To choose frontend stack (React, Vue, Angular)
   * To choose chart library (Chart.js, Recharts, D3)
   * Components:
     * MVP
       * Total number of job offers
       * Top technologies
       * Salary statistics
       * Global filtering (by locations, operating modes, experience, categories etc.)
     * Future
       * Alerts
       * Trends
     * Nice to have
       * Top companies
       * Heatmaps

**Job search:**
   * API (Flask/Django, FastAPI, Node/Express)
   * To choose frontend stack (React, Vue, Angular)

**CV generation:**
   * Template (HTML/CSS, Markdown or other)
   * Optional: template engine (Jinja2, Handlebars, etc.)
   * Optional: AI generated sections (About me etc.)

**Scraper:**
   * To consider: Scheduling (cron/GitHub Actions)
   * To consider: Support for other job portals
   * To consider: Store configuration constants (URLs, timeouts, selectors) in `constants.py` or `config.toml`

**Database:**
   * Consider implementing skills normalization system
   * Consider implementing skill matching algorithms for job recommendations
   * Database migration scripts for production deployments
   * Multi-region AWS RDS setup for high availability