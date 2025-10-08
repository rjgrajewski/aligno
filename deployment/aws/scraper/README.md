# Deployment - Aligno Scraper

Ten folder zawiera wszystkie pliki potrzebne do deployu scrapera Aligno na AWS Fargate.

## 📁 Struktura

```
deployment/aws/scraper/
├── Dockerfile                    # Obraz Docker dla scrapera
├── .dockerignore                 # Pliki ignorowane przez Docker
├── ecs-task-definition.json      # Definicja task ECS
├── deploy.sh                     # Główny skrypt deployu
├── quick-deploy.sh               # Szybki deploy (wszystkie kroki)
├── setup-iam.sh                  # Konfiguracja ról IAM
├── setup-infrastructure.sh       # Konfiguracja infrastruktury AWS
├── test-local.sh                 # Test lokalny Docker
├── management-commands.sh        # Komendy zarządzania serwisem
├── DEPLOY.md                     # Szczegółowa dokumentacja deployu
└── README.md                     # Ten plik
```

## 🚀 Szybki Start

### 1. Pierwszy deploy (pełna konfiguracja):
```bash
cd deployment/aws/scraper
./quick-deploy.sh
```

### 2. Aktualizacja kodu (tylko nowy image):
```bash
cd deployment/aws/scraper
./deploy.sh
```

### 3. Test lokalny:
```bash
cd deployment/aws/scraper
./test-local.sh
```

## 📋 Wymagania

- AWS CLI skonfigurowany
- Docker zainstalowany
- Uprawnienia do tworzenia zasobów AWS
- ARN sekretu bazy danych w AWS Secrets Manager

## 🔧 Zarządzanie

Po deployu możesz używać komend z `management-commands.sh`:

```bash
cd deployment/aws/scraper
source management-commands.sh

# Sprawdź status
check_status

# Zobacz logi
view_logs

# Restart serwisu
restart_service

# Skaluj serwis
scale_service 2
```

## 📚 Dokumentacja

- `DEPLOY.md` - Szczegółowa dokumentacja deployu
- `../../README.md` - Dokumentacja głównego projektu
- `../cleanup/README.md` - Dokumentacja czyszczenia zasobów AWS

## ⚠️ Uwagi

- Wszystkie skrypty muszą być uruchamiane z folderu `deployment/aws/scraper/`
- Docker build używa kontekstu z folderu głównego projektu (`../../..`)
- Konfiguracja sieciowa jest wykrywana automatycznie
