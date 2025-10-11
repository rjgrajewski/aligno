# Atlas - Skills Extraction & AI Categorization Module

Atlas to moduł do ekstrakcji i przetwarzania umiejętności (skills) z ofert pracy z użyciem AI.

## Funkcjonalność

### Ekstrakcja umiejętności
- Ekstrakcja unikalnych umiejętności z kolumny `tech_stack` w tabeli `offers`
- Parsowanie różnych formatów (średnik, nowa linia)
- Usuwanie poziomów zaawansowania (np. "Python: Advanced" → "Python")
- Zapis unikalnych umiejętności do tabeli `skills`
- Automatyczne pomijanie duplikatów

### Kategoryzacja AI (AWS Bedrock)
- Automatyczna kategoryzacja umiejętności za pomocą Claude 3.5 Sonnet
- Obsługa 18 kategorii (języki programowania, frameworki, bazy danych, itp.)
- Przetwarzanie wsadowe dla efektywności
- Zapisywanie kategorii bezpośrednio w bazie danych

## Użycie

### Ekstrakcja umiejętności z ofert

```bash
# Z katalogu głównego projektu
python -m atlas.extract_skills

# Lub bezpośrednio
python src/atlas/extract_skills.py
```

### Wyświetlenie przykładowych umiejętności

```bash
# Pokaż 20 pierwszych umiejętności
python -m atlas.extract_skills --sample

# Pokaż 50 pierwszych umiejętności
python -m atlas.extract_skills --sample --limit 50
```

### Kategoryzacja umiejętności za pomocą AI

```bash
# Kategoryzuj wszystkie umiejętności bez kategorii
python3 src/atlas/categorize_skills.py

# Kategoryzuj tylko pierwsze 100 umiejętności (do testów)
python3 src/atlas/categorize_skills.py --max-skills 100

# Użyj mniejszego batch size (domyślnie 50)
python3 src/atlas/categorize_skills.py --batch-size 20

# Pokaż statystyki kategorii
python3 src/atlas/categorize_skills.py --stats
```

## Struktura

```
atlas/
├── __init__.py             # Inicjalizacja modułu
├── __main__.py             # Entry point dla python -m
├── extract_skills.py       # Ekstrakcja umiejętności z ofert
├── categorize_skills.py    # Kategoryzacja AI za pomocą Bedrock
└── README.md              # Ta dokumentacja
```

## Tabela `skills`

Tabela przechowuje unikalne umiejętności wraz z kategorią:

```sql
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    original_skill_name TEXT UNIQUE NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Kategorie AI

Moduł kategoryzacji obsługuje 18 kategorii:

1. **Programming Language** - Python, Java, JavaScript, C++, itp.
2. **Framework/Library** - React, Django, Spring, Angular, itp.
3. **Database** - PostgreSQL, MongoDB, MySQL, Redis, itp.
4. **Cloud Platform** - AWS, Azure, GCP, itp.
5. **DevOps/CI-CD** - Docker, Kubernetes, Jenkins, GitLab CI, itp.
6. **Operating System** - Linux, Windows Server, macOS, itp.
7. **Testing Tool** - Jest, Pytest, Selenium, Cypress, itp.
8. **Version Control** - Git, GitHub, GitLab, Bitbucket, itp.
9. **Web Technology** - HTML, CSS, REST API, GraphQL, itp.
10. **Mobile Development** - React Native, Flutter, Swift, Kotlin, itp.
11. **Data Science/ML** - TensorFlow, PyTorch, Pandas, Scikit-learn, itp.
12. **Networking** - TCP/IP, DNS, VPN, Load Balancing, itp.
13. **Security** - OAuth, SSL/TLS, Penetration Testing, itp.
14. **Methodology/Practice** - Agile, Scrum, TDD, CI/CD, itp.
15. **Business Tool** - JIRA, Confluence, SAP, Salesforce, itp.
16. **Language Skill** - English, German, Spanish (języki obce)
17. **Soft Skill** - Communication, Leadership, Problem Solving, itp.
18. **Other** - Wszystko co nie pasuje do powyższych kategorii

## Wymagania

### Ekstrakcja umiejętności
- Połączenie z bazą danych (zmienne środowiskowe z `.env`)
- Tabela `offers` z danymi
- Kolumna `tech_stack` zawierająca umiejętności

### Kategoryzacja AI
- AWS credentials skonfigurowane (profile lub zmienne środowiskowe)
- Dostęp do AWS Bedrock w regionie `eu-central-1`
- Model: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Uprawnienia do `bedrock:InvokeModel`

## Algorytm ekstrakcji

1. Pobiera wszystkie wartości `tech_stack` z tabeli `offers`
2. Rozdziela tekst po separatorach: `;`, `\n` (nie przecinek!)
3. Usuwa poziomy zaawansowania (wszystko po dwukropku `:`)
4. Normalizuje (usuwa białe znaki, puste wartości)
5. Wstawia unikalne umiejętności do tabeli `skills`
6. Pomija duplikaty (ON CONFLICT DO NOTHING)

**Uwaga:** Przecinek nie jest separatorem, bo często występuje w nazwach umiejętności (np. "Windows Server (2019, 2022, 2025)")

## Dalszy rozwój

Możliwe rozszerzenia:
- ✅ **Kategoryzacja AI** - już zaimplementowane!
- 🔄 Normalizacja nazw umiejętności (np. "JavaScript" vs "javascript")
- 🔄 Mapowanie aliasów (np. "JS" → "JavaScript")  
- 🔄 Wykrywanie i parsowanie poziomów umiejętności
- 🔄 Tabela relacyjna many-to-many między offers a skills
- 🔄 API endpoint do przeszukiwania umiejętności
- 🔄 Clustering podobnych umiejętności

