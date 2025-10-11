# AWS Cleanup Scripts

Skrypty do czyszczenia zasobów AWS dla projektu Aligno.

## 🔍 audit-resources.sh

**Nowy!** Audytuje wszystkie zasoby AWS związane z projektem, wyświetlając kompletną listę wszystkich zasobów.

### Użycie:

```bash
cd aws/cleanup/scout
./audit-resources.sh
```

Skrypt przeskanuje i wyświetli:
- ✅ ECS Clusters, Services, Tasks i Task Definitions
- ✅ ECR Repositories (wraz z obrazami)
- ✅ EventBridge Rules i Scheduler Schedules
- ✅ CloudWatch Log Groups i Alarms
- ✅ IAM Roles i Policies
- ✅ VPC, Subnets, Security Groups
- ✅ Internet Gateways, NAT Gateways, Route Tables
- ✅ Elastic IPs
- ✅ Secrets Manager Secrets
- ✅ RDS Databases
- ✅ SNS Topics i SQS Queues

**💡 Uruchom ten skrypt najpierw, aby zobaczyć wszystkie pozostałości po poprzednich deployach!**

---

## 🧹 cleanup-aws.sh

Usuwa wszystkie zasoby AWS związane z modułem Scout, **zachowując bazę danych RDS**.

### Co usuwa:

- ✅ ECS Clusters, Services i Tasks
- ✅ ECS Task Definitions (wszystkie wersje)
- ✅ ECR Repositories (wraz z obrazami)
- ✅ EventBridge Rules i Scheduler Schedules
- ✅ CloudWatch Log Groups i Alarms
- ✅ Secrets Manager Secrets
- ✅ IAM Roles i Policies (task, execution, eventbridge)
- ✅ NAT Gateways
- ✅ Elastic IPs
- ✅ Security Groups (z inteligentnym usuwaniem zależności)
- ✅ VPC, Subnets, Internet Gateways
- ✅ Route Tables

### Co zachowuje:

- 💾 **RDS Database** - baza danych `aligno-db` pozostaje nienaruszona

### Użycie:

```bash
cd aws/cleanup/scout
./cleanup-aws.sh
```

Skrypt zapyta o potwierdzenie przed rozpoczęciem czyszczenia:
```
⚠️  This will delete everything EXCEPT the RDS database
Are you sure you want to continue? (yes/no):
```

### Funkcje:

1. **Inteligentne usuwanie Security Groups**
   - Automatycznie usuwa reguły odwołujące się do usuwanych grup
   - Obsługuje zależności między Security Groups

2. **Bezpieczne czyszczenie**
   - Zatrzymuje wszystkie running tasks przed usunięciem
   - Skaluje serwisy do 0 przed ich usunięciem
   - Detachuje Internet Gateways przed usunięciem

3. **Wielokrotne uruchamianie**
   - Bezpiecznie obsługuje sytuacje gdy zasoby już nie istnieją
   - Można uruchomić ponownie jeśli pierwsze czyszczenie nie usunęło wszystkiego

### Przykładowy output:

```
🧹 Cleaning up AWS resources for Aligno Scout...
⚠️  This will delete everything EXCEPT the RDS database

🛑 Stopping ECS tasks...
✅ Tasks stopped

🗑️  Deleting ECS services...
✅ Services deleted

🗑️  Deleting ECS cluster...
✅ Cluster deleted

...

✅ Cleanup completed!
📋 RDS database has been preserved
```

### Po czyszczeniu:

Po uruchomieniu skryptu:
- Wszystkie zasoby związane z modułem Scout zostaną usunięte
- RDS database zostanie zachowana i dostępna
- Możesz przeprowadzić świeży deployment używając `aws/deployment/scout/quick-deploy.sh`

### Koszty:

Po czyszczeniu pozostaje tylko RDS, który kosztuje około **$14.80/miesiąc**.

### Uwagi:

- ⚠️ Skrypt NIE usuwa bazy danych RDS - jeśli chcesz ją usunąć, zrób to ręcznie przez AWS Console
- 💡 Jeśli jakieś zasoby nie zostaną usunięte za pierwszym razem (np. z powodu zależności), poczekaj minutę i uruchom skrypt ponownie
- 🔐 Wymaga skonfigurowanego AWS CLI z odpowiednimi uprawnieniami

---

## 🚀 Workflow

### 1. Sprawdź pozostałości
Najpierw uruchom audyt, aby zobaczyć wszystkie zasoby:
```bash
./audit-resources.sh
```

### 2. Wyczyść zasoby
Jeśli widzisz niechciane pozostałości, uruchom cleanup:
```bash
./cleanup-aws.sh
```

### 3. Zweryfikuj czyszczenie
Po cleanup, uruchom ponownie audyt:
```bash
./audit-resources.sh
```

### 4. Powtórz jeśli potrzeba
Jeśli jakieś zasoby pozostały (np. NAT Gateway w trakcie usuwania), poczekaj 2-3 minuty i powtórz kroki 2-3.

---

## 🆘 Troubleshooting

### "Failed to delete VPC"
Prawdopodobnie jakieś zasoby wciąż istnieją w VPC. Uruchom `./audit-resources.sh` aby zobaczyć co pozostało, poczekaj kilka minut (szczególnie na NAT Gateways) i uruchom `./cleanup-aws.sh` ponownie.

### "Failed to delete Security Group"
Security Groups mogą mieć wzajemne zależności. Skrypt próbuje je rozwiązać automatycznie, ale czasami trzeba uruchomić cleanup dwukrotnie.

### "NAT Gateway still deleting"
NAT Gateways mogą potrzebować 5-10 minut na usunięcie. To jest normalne. Poczekaj i uruchom cleanup ponownie.

### Elastic IPs wciąż istnieją
Jeśli Elastic IP jest podłączony do NAT Gateway, musi zostać najpierw usunięty NAT Gateway. Poczekaj na zakończenie usuwania NAT Gateway i uruchom cleanup ponownie.

