# Aplikacija za prodaju ulaznica

Ova aplikacija omogućava kreiranje, uređivanje i brisanje događaja, kao i upravljanje više različitih tipova karata po događaju. Korisnicima je omogućena kupovina karata, a u slučaju povećanog broja korisnika aktivira se red čekanja koji sprečava preopterećenje sistema. Korisnici se iz reda čekanja postepeno puštaju u aplikaciju kako bi izvršili kupovinu.

---

## Opis funkcionalnosti

- **Kreiranje, izmena i brisanje događaja** (CRUD)
- **Više tipova karata** za svaki događaj (npr. standardna, VIP, studentska)
- **Kupovina karata** sa proverom dostupnosti
- **Red čekanja** za korisnike kada je aplikacija preopterećena
- **Postepeno puštanje korisnika** iz reda u aplikaciju
- **Upravljanje zalihama karata** po tipu i događaju
- **Jednostavan korisnički interfejs**

---

## Pokretanje projekta na lokalnoj mašini

### 1. Kloniraj repozitorijum

```bash
git clone https://github.com/elab-development/internet-tehnologije-2025-app_prodaja_ulaznica_2022_0234
```

## Pokretanje bez Dockera (XAMPP)

Pokreni MySQL u XAMPP-u, kreiraj bazu `prodaja_ulaznica`, a zatim iz direktorijuma `tickets` pokreni:

```bash
php artisan migrate
php artisan serve
```

U drugom terminalu iz direktorijuma `frontend` pokreni:

```bash
npm install
npm run dev
```

Frontend je na `http://localhost:5173`, a lokalni backend koristi XAMPP MySQL na `127.0.0.1:3306`.

## Pokretanje sa Dockerom

Iz glavnog direktorijuma projekta pokreni sve servise jednom komandom:

```bash
docker compose up -d --build
```

Frontend je na `http://localhost:5173`, backend na `http://localhost:8000`, a phpMyAdmin na `http://localhost:8080`. Docker MySQL je spolja dostupan na portu `3307`.

Lokalni i Docker režim koriste odvojene baze. Docker konfiguracija ne koristi XAMPP MySQL.

## API dokumentacija i testovi

Swagger UI je dostupan na `http://localhost:8000/api/documentation` kada je backend pokrenut (lokalno ili kroz Docker). Generiše se automatski iz `@OA` anotacija u kontrolerima komandom:

```bash
cd tickets
php artisan l5-swagger:generate
```

Backend testovi se pokreću ovako:

```bash
cd tickets
php artisan test
```

CI workflow automatski pokreće backend testove, frontend build i Docker build na push i pull request.

CD workflow se nalazi u `.github/workflows/cd.yml`. Na svaki push na `main` automatski gradi i objavljuje backend i frontend image-e u GitHub Container Registry. Može se pokrenuti i ručno iz taba **Actions** izborom workflow-a `CD` i opcije **Run workflow**.

Aplikacija koristi spoljne API-je za Art Institute of Chicago događaje, Open-Meteo vreme i Frankfurter kursnu listu. Endpoint-i su `/api/public/events`, `/api/external/weather` i `/api/external/exchange-rate`.
