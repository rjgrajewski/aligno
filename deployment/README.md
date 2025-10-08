# Deployment - Aligno Project

Ten folder zawiera konfiguracje deployment dla różnych komponentów projektu Aligno.

## 📁 Struktura

```
deployment/
├── aws/                        # AWS deployments i narzędzia
│   ├── scraper/               # Deployment scrapera na AWS Fargate
│   │   ├── Dockerfile
│   │   ├── deploy.sh
│   │   ├── quick-deploy.sh
│   │   └── ...
│   └── cleanup/               # Skrypty do czyszczenia zasobów AWS
│       └── cleanup-aws.sh
└── README.md                   # Ten plik
```

## 🚀 Dostępne Deploymenty

### Scraper (AWS Fargate)
- **Lokalizacja:** `aws/scraper/`
- **Platforma:** AWS Fargate (ECS)
- **Baza danych:** AWS RDS PostgreSQL
- **Funkcjonalność:** Zbieranie ofert pracy z JustJoin.it

**Szybki start:**
```bash
cd aws/scraper
./quick-deploy.sh
```

### Cleanup (AWS)
- **Lokalizacja:** `aws/cleanup/`
- **Funkcjonalność:** Czyszczenie zasobów AWS z zachowaniem bazy RDS

**Użycie:**
```bash
cd aws/cleanup
./cleanup-aws.sh
```

## 🔮 Przyszłe Deploymenty

W przyszłości można dodać:
- `api/` - API REST (FastAPI)
- `dashboard/` - Dashboard webowy
- `worker/` - Background workers
- `monitoring/` - Monitoring i alerting

## 📚 Dokumentacja

Każdy deployment ma własną dokumentację:
- `aws/scraper/README.md` - Instrukcje dla scrapera
- `aws/scraper/DEPLOY.md` - Szczegółowa dokumentacja deployu

## ⚠️ Uwagi

- Każdy deployment jest niezależny
- Wszystkie skrypty muszą być uruchamiane z odpowiedniego folderu
- Docker build używa kontekstu z folderu nadrzędnego