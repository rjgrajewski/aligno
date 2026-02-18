# Atlas - AI Skills Analysis

![Python 3.9](https://img.shields.io/badge/python-3.9-blue) ![OpenAI](https://img.shields.io/badge/OpenAI-API-green)

## 🚀 Overview

Atlas is the intelligence layer of Aligno, responsible for analyzing raw job data collected by Scout. It uses AI to extract, categorize, and standardize skills and technologies from job descriptions.

## 🔧 Key Features

- **Skill Extraction**: Parses complex job descriptions to identify required technical skills.
- **Categorization**: Groups skills into logical categories (e.g., Languages, Frameworks, Cloud).
- **Standardization**: Maps varied skill names to a canonical set for consistent analysis.

## 📁 Architecture

```
atlas/
├── __main__.py              # Entry point for Atlas
├── categorize_skills.py     # AI logic for categorizing extracted skills
├── extract_skills.py        # AI logic for extracting skills from descriptions
└── README.md                # This file
```

## 🚧 Status

**Current Status**: *In Progress*

The module is currently being developed to enhance the data quality of collected job offers.
