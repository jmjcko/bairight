# BYOK Multi-Model Orchestration & Self-Healing Architecture

Tento dokument detailně popisuje architekturu multi-modelové integrace (Bring Your Own Key — BYOK) v aplikaci **bAIright**, mechanismy automatické obnovy (self-healing failover), dynamické objevování modelů, denní synchronizační rutinu a uživatelský onboarding.

---

## 1. Architektonické principy & Bezpečnostní model (Zero-Knowledge)

1. **Zero-Knowledge Vault**:
   - Uživatelské API klíče se **NIKDY neukládají do vzdálené databáze ani do logů serveru**.
   - Klíče jsou uchovávány výhradně v lokálním úložišti prohlížeče (`localStorage`) spravovaném třídou `VaultService`.
   - Na server jsou klíče posílány výhradně v šifrovaném HTTPS těle konkrétního požadavku (`/api/agent/test-key` nebo `/api/agent/chat`) a po dokončení požadavku jsou okamžitě uvolněny z paměti.

2. **Multi-Model Orchestrace bez závislosti na jediném vendorovi**:
   - Podpora tří předních světových poskytovatelů:
     - **Google Gemini** (Výchozí, 100% bezplatný tier v Google AI Studio, 15 RPM / 1 500 RPD, 1M kontext).
     - **Anthropic Claude** (Klinický a biomechanický reasoning, Sonnet řada, podpora Workspace ID).
     - **OpenAI ChatGPT** (Univerzální standard, GPT-4o a odlehčená řada GPT-4o-mini).

3. **Striktní Cyber-glass Design & Zero Icons Mandát**:
   - Veškeré UI komponenty BYOK Vaultu a nápovědy striktně dodržují princip **Zero Icons & Zero Generic Emoticons** (žádné dekorativní ikony, žádné robotí hlavy, čistá typografie, monospace indikátory stavu a decentní cyan/teal linky).

---

## 2. Klíčové komponenty systému

```
+-----------------------------------------------------------------------------------+
|                            AIEngineSubscriptionModal                              |
|   (Cyber-glass UI, Zero-Knowledge Vault, Step-by-Step Onboarding Guides [1]-[4])  |
+-----------------------------------------------------------------------------------+
                                       |
                                       v
                    +-------------------------------------+
                    |       POST /api/agent/test-key       |
                    |   (Ověření klíče, model discovery,  |
                    |    detekce nulového kreditu)        |
                    +-------------------------------------+
                                       |
                                       v
+-----------------------------------------------------------------------------------+
|                           ModelDiscoveryService                                    |
|   - getCandidateModels() (Vážené hodnocení verzí, Flash vs Pro, vyřazení TTS/Img) |
|   - executeWithResilientFailover() (Postupný failover, blacklist 404/410/503)     |
|   - On-the-fly Live Discovery (Gemini, Claude, OpenAI)                            |
|   - Paměť posledního funkčního modelu na klíč (lastSuccessfulModel)               |
+-----------------------------------------------------------------------------------+
         |                                |                                |
         v                                v                                v
+------------------+            +-------------------+            +------------------+
|  Google Gemini   |            |  Anthropic Claude |            |  OpenAI ChatGPT  |
|  (AI Studio)     |            |  (Messages API)   |            |  (Completions)   |
+------------------+            +-------------------+            +------------------+
         ^                                ^                                ^
         +--------------------------------+--------------------------------+
                                          |
                         +----------------------------------+
                         |    GET/POST /api/cron/sync-models|
                         |   (Denní audit a registry sync)  |
                         +----------------------------------+
```

### 2.1 ModelDiscoveryService (`src/lib/agent/model-discovery-service.ts`)
Centrální mozek multi-modelové integrace:
- **Prioritní řazení a skórování**:
  - Gemini: Flash modely preferovány před Pro modely pro nízkou latenci; automatická penalizace preview a experimentálních verzí; bonus pro novější verze.
  - Claude: Sonnet modely preferovány před Haiku či Opus; novější verze (3.7 > 3.5) získávají vyšší váhu.
  - OpenAI: `gpt-4o` prioritizován jako vlajkový model, následován `gpt-4o-mini` a reasoning modely `o3-mini`, s vyloučením specializovaných modelů pro audio, realtime a embeddingy.
- **Resilientní Failover (`executeWithResilientFailover`)**:
  - Zkouší kandidáty v optimalizované frontě.
  - Pokud model selže na HTTP 404/410, parsuje náhradní model z chybové zprávy poskytovatele a okamžitě ho zařadí na začátek fronty.
  - Při HTTP 503 (špička serveru) krátce vyčká a přejde na další model.
  - Pokud vyčerpá všechny přednastavené kandidáty, provede **On-the-fly Live Discovery** v reálném čase přes API daného poskytovatele.
  - Pamatuje si naposledy úspěšný model pro daný klíč (`lastSuccessfulModel`), takže další volání jsou okamžitá bez nutnosti zkoušet modely od začátku.

### 2.2 Testování a validace klíčů (`src/app/api/agent/test-key/route.ts`)
- **Google Gemini**: Volá `GET /v1beta/models?key=...`, objevuje dostupné modely a vrací preferovaný model.
- **Anthropic Claude**: 
  - Parsuje klíč přes `parseAnthropicKey()`. Podporuje jak standardní klíče (`sk-ant-api03-...`), tak User klíče s Workspace ID (`sk-ant-usr-...:wrkspc_ID` i `KEY|wrkspc_ID`).
  - Posílá hlavičku `anthropic-workspace-id`.
  - Pokud Anthropic nahlásí chybějící workspace ID, vrátí detailní návod, jak formát upravit.
  - Pokud nahlásí vyčerpaný kredit (`credit balance is too low`), vrátí konstruktivní varování `creditWarning: true` s návodem na dobití bez zablokování uživatele.
- **OpenAI ChatGPT**:
  - Volá `GET https://api.openai.com/v1/models` s `Authorization: Bearer <key>`.
  - Objevuje aktivní modely přes `discoverOpenAIModels()`.
  - Provádí lehký validační dotaz pro ověření stavu kreditu (`insufficient_quota`). Pokud je kredit vyčerpán, vrací `creditWarning: true` s vysvětlením, že předplatné ChatGPT Plus se na vývojářské API nevztahuje.

### 2.3 Exekuce chatu a ošetření chyb (`src/app/api/agent/chat/route.ts`)
- Všichni 3 provideři jsou řízeni přes `ModelDiscoveryService.executeWithResilientFailover`.
- Detailní bilingvní (CS + EN) chybové zprávy přímo v těle asistenta v chatu:
  - `OPENAI_CREDIT_EXHAUSTED` -> Vysvětlení rozdílu mezi ChatGPT Plus ($20) a API kreditem, odkaz na OpenAI Billing, doporučení vygenerovat nový klíč kvůli vyrovnávací paměti platební brány, nebo možnost přepnout na bezplatné Gemini.
  - `ANTHROPIC_CREDIT_EXHAUSTED` -> Vysvětlení, že stávající klíč si pamatuje stav bez kreditu cca 15–30 minut a je potřeba po dobití vygenerovat nový klíč v Anthropic Console.
  - `ANTHROPIC_WORKSPACE_REQUIRED` -> Návod na zadání `KLÍČ:wrkspc_ID`.
  - `401 Invalid Key` -> Nápověda s přímým odkazem na konzoli poskytovatele.
  - `503 / 429 Overload` -> Informace o dočasném přetížení serverů se zachováním parametrů z průvodce v paměti.

### 2.4 Denní synchronizační rutina (`src/app/api/cron/sync-models/route.ts`)
- Podporuje GET (např. automatický Vercel Cron) i POST (manuální spuštění s vlastním testovacím klíčem).
- Zabezpečeno přes volitelný `CRON_SECRET` v hlavičce `Authorization: Bearer <token>` nebo URL parametru `?secret=<token>`.
- V reálném čase projde všechny 3 providery, aktualizuje interní paměťovou cache modelů a vrátí diagnostické shrnutí.

### 2.5 Uživatelský Onboarding v modalu (`src/components/AIEngineSubscriptionModal.tsx`)
- Pod každým poskytovatelem je interaktivní tlačítko **„Návod krok za krokem ▾“** / **„Step-by-step setup guide ▾“**.
- Rozbalí přehlednou kartu s barevným zvýrazněním cenového modelu:
  - **Google Gemini**: Zvýraznění, že je **100% ZDARMA bez platební karty**.
  - **Anthropic Claude**: Upozornění, že předplatné Claude Pro neplatí a je třeba dobít min. $5 kredit.
  - **OpenAI ChatGPT**: Upozornění, že předplatné ChatGPT Plus neplatí a je třeba dobít min. $5 na platformě.
- Čtyři číslované kroky `[1]`, `[2]`, `[3]`, `[4]` s přímými prokliky do příslušných sekcí konzolí poskytovatelů.

---

## 3. Přehled dnešních oprav a architektonických zásahů

| Oblast | Původní problém / Stav | Architektonické řešení | Soubory |
| :--- | :--- | :--- | :--- |
| **Claude Multi-Block Parsing** | Anthropic vrátil pole bloků, z nichž první byl `thinking` nebo prázdný text, což způsobilo pád s hláškou „Žádný z modelů neodpověděl“. | Filtrování a spojení všech `text` bloků; fallback na `thinking` text; prevence prázdného řetězce v chatu. | `src/app/api/agent/chat/route.ts` |
| **Claude Live Discovery & Failover** | Statický seznam kandidátů mohl zastarat nebo selhat při změně modelů Anthropicem. | Implementováno dynamické volání `discoverClaudeModels`, váhové skórování verzí a sledování `failureLogs`. | `src/lib/agent/model-discovery-service.ts` |
| **OpenAI Failover & Quota Detekce** | OpenAI bylo voláno přímo s `gpt-4o` natvrdo bez failoveru; 429 quota padalo na generickou chybu. | Povýšení na `executeWithResilientFailover`, on-the-fly discovery, detekce `insufficient_quota` a bilingvní nápověda. | `src/app/api/agent/chat/route.ts`, `src/lib/agent/model-discovery-service.ts`, `src/app/api/agent/test-key/route.ts` |
| **Denní kontrola modelů (Cron)** | Absence automatické rutiny na prověřování aktivních modelů poskytovatelů. | Vytvořen zabezpečený endpoint `/api/cron/sync-models` pro Vercel Cron a automatizované audity. | `src/app/api/cron/sync-models/route.ts` |
| **Uživatelský Onboarding (Návod)** | Uživatelé tápali, jak klíče získat a proč jim nefunguje ChatGPT Plus / Claude Pro předplatné. | Implementován rozbalovací bilingvní průvodce krok za krokem [1]-[4] s vysvětlením platebních modelů v Cyber-glass stylu. | `src/components/AIEngineSubscriptionModal.tsx` |
| **Kolize UI tlačítek v chatu** | Plovoucí tlačítka „Jak to funguje“ a „Koupit kafe“ překrývala input zpráv na stránce chatu. | Podmíněno zobrazení na `{activeTab !== 'chat' && (...) }`. | `src/app/page.tsx` |
| **Překryv hlavičky na menších rozlišeních** | Absolutně centrovaný blok navigace kolidoval s profilem a přepínačem enginů. | Přechod na čistý Flexbox (`flex-1 min-w-0`), oříznutí textu agenta (`truncate`) a responzivní skrytí doplňkových prvků na mobilech/tabletech. | `src/app/page.tsx`, `src/components/UserProfileCapsule.tsx` |

---

## 4. Ověření a testovací pokrytí (Quality Gate)

Všechny změny jsou pokryty automatizovanými testy:
- Unit testy pro validaci a objevování klíčů: `src/app/api/agent/test-key/__tests__/test-key.test.ts` (10 testů)
- Unit testy pro failover a on-the-fly discovery: `src/lib/agent/__tests__/model-discovery-service.test.ts` (11 testů)
- Unit testy pro denní cron synchronizaci: `src/app/api/cron/sync-models/__tests__/sync-models.test.ts` (5 testů)
- Unit testy pro UI modal a průvodce krok za krokem: `src/components/__tests__/AIEngineSubscriptionModal.test.tsx` (5 testů)
- Celkový stav: **100% test pass rate**, **0 TypeScript chyb** (`npx tsc --noEmit`).
