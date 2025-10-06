CREATE TABLE IF NOT EXISTS offers (
    job_url TEXT PRIMARY KEY,
    job_title TEXT,
    category TEXT,
    company TEXT,
    location TEXT,
    salary_any TEXT,
    salary_b2b TEXT,
    salary_b2b_min NUMERIC,
    salary_b2b_max NUMERIC,
    salary_b2b_per TEXT,
    salary_internship TEXT,
    salary_mandate TEXT,
    salary_perm TEXT,
    salary_specific_task TEXT,
    work_type TEXT,
    experience TEXT,
    employment_type TEXT,
    operating_mode TEXT,
    tech_stack TEXT
);

-- Create or replace function to parse salary_b2b
CREATE OR REPLACE FUNCTION parse_salary_b2b()
RETURNS TRIGGER AS $$
BEGIN
    -- Parse only if salary_b2b is not NULL and not 'N/A'
    IF NEW.salary_b2b IS NOT NULL AND NEW.salary_b2b != 'N/A' THEN
        -- Extract min value (first number in range)
        NEW.salary_b2b_min := NULLIF(
            REGEXP_REPLACE(SPLIT_PART(NEW.salary_b2b, '-', 1), '[^0-9.]', '', 'g'),
            ''
        )::NUMERIC;
        
        -- Extract max value (second number in range)
        -- If no range exists (no '-'), use min value
        NEW.salary_b2b_max := COALESCE(
            NULLIF(
                REGEXP_REPLACE(
                    SPLIT_PART(SPLIT_PART(NEW.salary_b2b, E'\n', 1), '-', 2),
                    '[^0-9.]',
                    '',
                    'g'
                ),
                ''
            )::NUMERIC,
            NEW.salary_b2b_min
        );
        
        -- Extract period (hour, day, month, year)
        NEW.salary_b2b_per := CASE
            WHEN NEW.salary_b2b ILIKE '%per hour%' THEN 'hour'
            WHEN NEW.salary_b2b ILIKE '%per day%' THEN 'day'
            WHEN NEW.salary_b2b ILIKE '%per month%' THEN 'month'
            WHEN NEW.salary_b2b ILIKE '%per year%' THEN 'year'
            ELSE NULL
        END;
    ELSE
        NEW.salary_b2b_min := NULL;
        NEW.salary_b2b_max := NULL;
        NEW.salary_b2b_per := NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically parse salary_b2b on INSERT or UPDATE
DROP TRIGGER IF EXISTS parse_salary_b2b_trigger ON offers;
CREATE TRIGGER parse_salary_b2b_trigger
    BEFORE INSERT OR UPDATE OF salary_b2b ON offers
    FOR EACH ROW
    EXECUTE FUNCTION parse_salary_b2b();

