import { NextRequest, NextResponse } from 'next/server';
import { 
  DomainAnalysisResult,
  ExtractedDomainParameter,
  UNIVERSAL_BRAND_PARAMETER 
} from '@/lib/agent/domain-parameter-discovery';
import {
  getCachedAnalysis,
  setCachedAnalysis,
} from '@/lib/agent/parameter-cache-service';

// ————————————————————————————————————————————————
// Ensure brand parameter is present in the analysis
// ————————————————————————————————————————————————
function ensureBrandParameter(params: ExtractedDomainParameter[], locale: string): ExtractedDomainParameter[] {
  const hasBrand = params.some(
    (p) =>
      p.id === 'brand_preferences' ||
      p.id.includes('brand') ||
      p.name.toLowerCase().includes('značk') ||
      p.name.toLowerCase().includes('výrobc') ||
      p.name.toLowerCase().includes('brand') ||
      p.name.toLowerCase().includes('manufacturer')
  );
  if (!hasBrand) {
    const brandParam: ExtractedDomainParameter = locale === 'en'
      ? {
          id: 'brand_preferences',
          name: 'Brand & Manufacturers',
          category: 'Brands & Manufacturers',
          importance: 'recommended',
          rationale: 'Specify preferred brands you trust and exclude brands you do not want recommended.',
          icon: '🏷️',
          suggestedComponent: 'brands',
          suggestedValues: [
            'All verified brands (open selection)',
            'I have specific preferred brands',
            'I want to exclude specific manufacturers',
          ],
        }
      : UNIVERSAL_BRAND_PARAMETER;
    return [...params, brandParam];
  }
  return params;
}

// ————————————————————————————————————————————————
// POST /api/agent/research-parameters
// Always-On Luke Research with Cache Layer
// ————————————————————————————————————————————————
export async function POST(req: NextRequest) {
  try {
    const { query, locale = 'cs' } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'Please enter a product name or category for parameter analysis.'
              : 'Zadejte prosím název produktu nebo kategorii pro analýzu parametrů.',
        },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();

    // ——— STEP 1: Cache lookup ———
    const cached = await getCachedAnalysis(trimmedQuery, locale);
    if (cached) {
      console.log(`[Luke] Cache HIT (${cached.source}): "${trimmedQuery}"`);
      return NextResponse.json({
        success: true,
        analysis: cached.analysis,
        source: cached.source,
      });
    }

    // ——— STEP 2: Require server-side API key ———
    const serverKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!serverKey) {
      console.error('[Luke] GOOGLE_GEMINI_API_KEY not configured in environment');
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'AI research service is not configured. Please contact support.'
              : 'Výzkumná služba AI není nakonfigurována. Kontaktujte prosím podporu.',
        },
        { status: 503 }
      );
    }

    // ——— STEP 3: Always call Gemini Flash ———
    console.log(`[Luke] Cache MISS — calling Gemini Flash for: "${trimmedQuery}"`);
    let analysis: DomainAnalysisResult | null = null;

    try {
      analysis = await researchParametersWithLuke(trimmedQuery, serverKey, 'google_gemini', locale);
    } catch (llmErr) {
      console.error('[Luke] LLM call failed:', llmErr);
    }

    if (!analysis || !analysis.parameters || analysis.parameters.length < 8) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'Parameter analysis failed. Please try again.'
              : 'Analýza parametrů selhala. Zkuste to prosím znovu.',
          retryable: true,
        },
        { status: 502 }
      );
    }

    // ——— STEP 4: Ensure brand parameter exists ———
    analysis.parameters = ensureBrandParameter(analysis.parameters, locale);

    // ——— STEP 5: Cache the result ———
    setCachedAnalysis(trimmedQuery, analysis, locale).catch((err) =>
      console.warn('[Luke] Cache write failed (non-critical):', err)
    );

    return NextResponse.json({
      success: true,
      analysis,
      source: 'luke_gemini_flash',
    });
  } catch (error: any) {
    console.error('Error in research-parameters endpoint:', error);
    return NextResponse.json(
      { error: 'Chyba při provádění průzkumu parametrů.' },
      { status: 500 }
    );
  }
}


async function researchParametersWithLuke(
  categoryQuery: string,
  apiKey: string,
  providerId?: string,
  locale: string = 'cs'
): Promise<DomainAnalysisResult | null> {
  const isEn = locale === 'en';
  const languageInstruction = isEn
    ? `IMPORTANT: The user interface is in English. You MUST generate all output fields in fluent, natural English. This includes categoryName, agentName, description, parameter names, categories, rationales, suggested values, alternative parameters, questions, and systemPrompt.`
    : `Jazyk výstupu: Čeština. Všechny texty a parametry vygeneruj v přirozené češtině.`;

  const brandParamInstruction = isEn
    ? `MANDATORY BRAND GOVERNANCE: You MUST ALWAYS INCLUDE a brand preferences parameter ("Brand & Manufacturers (Preferred vs. Forbidden)", id: "brand_preferences", suggestedComponent: "brands"). This parameter enables the user to explicitly specify which brands they want (preferred) and which they reject (forbidden).`
    : `POVINNÁ IZOLACE ZNAČEK: Mezi vygenerovanými parametry MUSÍŠ VŽDY ZAHRNOUT parametr pro značky a výrobce ("Značka & Výrobci (Preferované vs. Zakázané)", id: "brand_preferences", suggestedComponent: "brands"). Tento parametr slouží k tomu, aby si uživatel mohl explicitně napsat, které konkrétní značky chce (preferuje) a které nechce (zakazuje doporučit).`;

  const metaPrompt = `
${languageInstruction}

Jsi Luke, špičkový produktový analytik, nezávislý nákupčí a reverzní inženýr nákupního rozhodování v expertním systému bAIright.
Znáš psychologii nákupu, víš, jaká úskalí skrývají marketingové materiály výrobců, a přesně víš, na co se zákazníka zeptat, aby zúžil výběr na ten nejvhodnější produkt. Nemáš žádný zájem na prodeji konkrétní značky nebo modelu. Tvojí jedinou misí je ochránit uživatele před nevhodným nákupem, dodat mu maximální jistotu a ušetřit mu hodiny složité rešerše.

Uživatel chce koupit: "${categoryQuery}".

Tvým úkolem je na základě tohoto vstupu vygenerovat MINIMÁLNĚ 10 AŽ 14 NEJDŮLEŽITĚJŠÍCH PARAMETRŮ a rozhodovacích kritérií + 3 až 5 alternativních do poolu návrhů. Tyto parametry poslouží jako základ pro Intake Wizard, který uživateli pomůže sestavit detailní a přesný nákupní prompt.

## TŘI ZLATÁ PRAVIDLA NÁKUPNÍHO MYŠLENÍ AGENTA LUKEA (MANDATORY):

1. 🚲 ELEMENTÁRNÍ ROZDĚLENÍ TRHU VŽDY JAKO PARAMETR Č. 1 A ADAPTIVNÍ DETEKCE SPECIFICKÉ POD-KATEGORIE (SUB-CATEGORY SPECIFICITY):
   - ROZLIŠUJ OBECNÝ DOTAZ VS. SPECIFICKÝ SUB-TYP:
     a) Pokud je dotaz OBECNÝ (např. "jízdní kolo", "myčka", "notebook", "kávovar"):
        - Parametr č. 1 musí být elementární zařazení na trhu a typologie (např. "Typ kola: Silniční vs Gravel vs MTB vs E-bike").
     b) Pokud uživatel ZADAL KONKRÉTNÍ POD-TYP (např. "endurance silniční kolo", "vestavná myčka 45cm", "herní notebook 15"):
        - ROVNĚŽ PŘESNĚ SPECIFIKUJ PARAMETRY PRO TENTO POD-TYP!
        - ZÁKAZ vkládat irelevantní parametry jiných kategorií! U "endurance silničního kola" STRIKTNÍ ZÁKAZ vkládat elektropohony/baterie nebo odpružené vidlice.
        - Zaměř se přímo na odlišující vlastnosti dané pod-kategorie (u endurance silničky: Stack/Reach geometrie, šířka plášťů 28-32mm, sada řazení Shimano 105/Ultegra, pohlcování vibrací karbonovou sedlovkou, kotoučové brzdy).

2. 🧬 POVINNÉ TĚLESNÉ BIOMETRICKÉ A ZDRAVOTNÍ PARAMETRY U PRODUKTŮ VÁZANÝCH NA TĚLO (BIOMETRICS & MEDICAL PROFILE):
   - U všech produktů, které přicházejí do přímého kontaktu s tělem, nesou váhu uživatele nebo ovlivňují pohybový aparát (jízdní kola, běžecká i treková obuv, lyže a lyžáky, kancelářské židle, matrace, batohy, helmy, oblečení, sportovní pomůcky):
   - VŽDY MUSÍŠ ZAHRNOUT JAKO SAMOSTATNÝ POVINNÝ PARAMETR (např. Parametr č. 2) OSOBNÍ BIOMETRICKÉ A ZDRAVOTNÍ PARAMETRY UŽIVATELE:
     a) Přesná výška postavy (cm) a tělesná hmotnost (kg) – kritické pro velikost rámu, flex index lyží, tuhost matrace, dimenzování pístu židle, drop a tlumení bot.
     b) Specifické anatomické rozměry – šířka nohy/chodidla (standard vs. široké 2E/4E, úzká pata), vnitřní délka nohou (inseam), obvod hlavy / hrudníku / pasu.
     c) Zdravotní anamnéza a prodělané operace – operace kolenních vazů a menisků, operace páteře (výhřez plotének), skolióza, chronické bolesti beder a krku, vbočený palec (hallux valgus). Tyto zdravotní faktory mají absolutní přednost před designem!

3. 🔟 GARANCE MINIMÁLNĚ 10 STRUKTUROVANÝCH PARAMETRŮ:
   - Výstup musí obsahovat minimálně 10 parametrů (ideálně 10 až 14) pokrývajících:
     1. Primární tržní segment / typologie
     2. Uživatelská biometrie / tělesná & zdravotní kritéria (pokud je produkt tělesně vázán)
     3. Klíčové technologické jádro / motor / pohon
     4. Materiálové složení a konstrukční odolnost
     5. Ergonomie, rozměry a montážní/prostorové limity
     6. Bezpečnostní prvky a certifikace
     7. Servisovatelnost, rozebíratelnost a dostupnost náhradních dílů v ČR
     8. Provozní náklady, energetická náročnost a údržba
     9. Akustický komfort / hlučnost / reálný dojezd či výdrž
     10. ${brandParamInstruction}

## STRIKTNÍ ZÁKAZ VÁGNÍCH KLIŠÉ:
- Žádná "Cena", "Barva", "Vzhled", "Kvalita zpracování", "Spolehlivost", "Ergonomie", "Technologický standard", "Základní výbava".
- Každý parametr musí mít v "rationale" dvě složky:
  1. Insight z fór a testů (proč na tom záleží a jaké je riziko špatné volby).
  2. Konkrétní návodnou otázku pro uživatele.

## FEW-SHOT REFERENČNÍ VZOR (Příklad správné hloubky a hierarchie na dotaz "Jízdní kolo"):
{
  "keyword": "Jízdní kolo",
  "matchedDomain": "bicycles",
  "categoryName": "Jízdní Kola & Elektromobilita",
  "agentName": "Luke: Specialista na Jízdní Kola & E-biky",
  "description": "Nezávislý nákupní analytik pro jízdní kola. Analyzuje disciplínu, biometrii jezdce, geometrii rámu, sady řazení, odpružení a servisovatelnost.",
  "parameters": [
    {
      "id": "bike_type_category",
      "name": "Typ kola a disciplína",
      "category": "Kategorie & Disciplína",
      "importance": "mandatory",
      "rationale": "Výběr špatného typu kola je nejčastější chybou – horské kolo na asfaltu drhne a bere energii, silniční neprojede lesem a gravel vyžaduje specifický posed. Otázka pro vás: Po jakém povrchu a v jakém terénu budete reálně jezdit nejčastěji?",
      "icon": "🚲",
      "suggestedComponent": "chips",
      "suggestedValues": ["Gravel (univerzální na silnici, cyklostezky i šotolinu)", "Horské kolo MTB (kořeny, kameny a lesní traily)", "Silniční kolo (maximální rychlost na hladkém asfaltu)", "Městské / Trekingové (vzpřímený posed a nosiče)", "Elektrokolo E-bike (středový motor do kopců)"]
    },
    {
      "id": "bike_rider_biometrics",
      "name": "Biometrie jezdce & zdravotní profil (Výška, váha, délka nohou, operace páteře/kolen)",
      "category": "Biometrie & Zdraví",
      "importance": "mandatory",
      "rationale": "Výška a délka nohou určují přesnou velikost rámu (S/M/L/XL), váha jezdce je nutná pro nastavení tlaku vzduchové vidlice. Lidé po operaci kolenních vazů nebo s výhřezem ploténky potřebují vzpřímenější geometrii a celoodpružený rám. Otázka pro vás: Jaká je vaše výška, váha a máte potíže s koleny či zády?",
      "icon": "🧬",
      "suggestedComponent": "chips",
      "suggestedValues": ["Výška do 175 cm / Váha do 75 kg", "Výška 175–185 cm / Váha 75–90 kg", "Výška 185+ cm / Váha 90+ kg", "Po operaci zad/kolen (požadavek na vzpřímený posed a tlumení rázu)"]
    },
    {
      "id": "bike_frame_material",
      "name": "Materiál rámu (Karbon s absorpcí mikrovibrací vs. Odolný hydroformovaný hliník AL 6061)",
      "category": "Rám & Konstrukce",
      "importance": "mandatory",
      "rationale": "Hliník je odolný a levnější, ale přenáší mikrovibrace do zápěstí a krku. Karbon je lehčí, tužší v záběru a přirozeně tlumí vibrace terénu. Otázka pro vás: Hledáte maximální lehkost a komfort tlumení, nebo preferujete odolnost hliníku při pádech?",
      "icon": "📐",
      "suggestedComponent": "chips",
      "suggestedValues": ["Karbonový rám (nízká váha a filtrace vibrací)", "Hydroformovaný hliník AL 6061/7005 (odolný a cenově dostupný)"]
    },
    {
      "id": "bike_suspension_system",
      "name": "Systém odpružení (Pevný rám vs. Vzduchová vidlice s lockoutem vs. Full-suspension)",
      "category": "Odpružení",
      "importance": "mandatory",
      "rationale": "Levné pružinové vidlice v zimě tuhnou a nelze je nastavit na váhu jezdce. Vzduchovou vidlici natlakujete přesně na své tělo a celoodpružený rám šetří bederní páteř. Otázka pro vás: Vyžadujete žehlení nerovností a možnost zamknutí do kopce?",
      "icon": "🚵",
      "suggestedComponent": "chips",
      "suggestedValues": ["Pevná vidlice (gravel a silnice pro maximální přenos síly)", "Přední vzduchová vidlice (Hardtail s lockoutem na řídítkách)", "Celoodpružený rám (Full-suspension pro šetření zad v terénu)"]
    },
    {
      "id": "bike_drivetrain_groupset",
      "name": "Sada řazení & převodový poměr (Jednopřevodník 1x12 Shimano XT/Deore/SRAM vs. 2x11)",
      "category": "Pohon & Řazení",
      "importance": "mandatory",
      "rationale": "Jednopřevodník 1x12 eliminuje padání řetězu v terénu a usnadňuje ovládání, zatímco 2x11 nabízí jemnější silniční odstupňování. Otázka pro vás: Jezdíte kopcovitý terén a traily, nebo dlouhé silniční rovinky?",
      "icon": "⚙️",
      "suggestedComponent": "chips",
      "suggestedValues": ["1x12 s kazetou 10–51T (jednoduchost v terénu)", "2x11 / 2x12 (jemné odstupňování na silnici a asfalt)"]
    },
    {
      "id": "bike_brakes_hydraulic",
      "name": "Brzdový systém (Hydraulické kotoučové 2/4pístkové brzdy vs. mechanické lankové)",
      "category": "Bezpečnost",
      "importance": "mandatory",
      "rationale": "Mechanická lanka v dlouhých sjezdech vadnou a unavují prsty. Hydraulické kotouče zastaví kolo bezpečně jedním prstem i za deště a bláta. Otázka pro vás: Sjíždíte prudké kopce a požadujete okamžitý brzdný účinek?",
      "icon": "🛑",
      "suggestedComponent": "chips",
      "suggestedValues": ["Hydraulické kotoučové brzdy Shimano/SRAM (vysoký brzdný účinek)", "4pístkové hydraulické brzdy (pro těžší jezdce, sjezdy a e-biky)"]
    },
    {
      "id": "bike_wheel_tire_size",
      "name": "Průměr kol a šířka plášťů (29" vs. 27.5" vs. Gravel 40–45 mm Tubeless Ready)",
      "category": "Kola & Trakce",
      "importance": "recommended",
      "rationale": "Kola 29" lépe překonávají překážky a drží setrvačnost, 27.5" jsou hravější v zatáčkách. Bezdušové pláště (tubeless) eliminují defekty o trny. Otázka pro vás: Preferujete rychlost a stabilitu na nerovnostech, nebo obratnost?",
      "icon": "🛞",
      "suggestedComponent": "chips",
      "suggestedValues": ["29" kola (skvělé převalování překážek a setrvačnost)", "Gravel pláště 40–45 mm s bezdušovým tmelem", "27.5" kola pro menší postavu a hravost"]
    },
    {
      "id": "bike_ebike_motor_battery",
      "name": "Středový motor s torzním snímačem (Bosch/Shimano 85 Nm) & baterie 600–750 Wh",
      "category": "Elektropohon",
      "importance": "recommended",
      "rationale": "Levné motory v náboji trhají a ztrácí trakci. Středový motor s torzním snímačem dávkuje přípomoc plynule podle síly vašeho šlápnutí. Otázka pro vás: Požadujete asistenci do prudkých kopců a dojezd 80+ km?",
      "icon": "⚡",
      "suggestedComponent": "chips",
      "suggestedValues": ["Středový motor Bosch CX / Shimano EP8 (85 Nm) + 700+ Wh baterie", "Lehký pohon SL (50–60 Nm, 400 Wh) pro přirozený pocit z jízdy", "Klasické kolo bez motoru"]
    },
    {
      "id": "bike_cockpit_ergonomics",
      "name": "Ergonomie kokpitu & sedlo (Šířka řídítek, sklon představce, ergonomické gripy)",
      "category": "Ergonomie & Pohodlí",
      "importance": "recommended",
      "rationale": "Špatná šířka řídítek způsobuje brnění prstů (útlak ulnárního nervu) a bolesti trapézů. Ergonomické gripy a správná šířka sedla dle sedacích kostí jsou klíčem k jízdě bez bolesti. Otázka pro vás: Míváte při delší jízdě problémy s brněním rukou nebo otlaky?",
      "icon": "🖐️",
      "suggestedComponent": "chips",
      "suggestedValues": ["Ergonomické gripy s opěrkou dlaně + sedlo s anatomickým výřezem", "Standardní sportovní kokpit"]
    },
    {
      "id": "bike_weight_capacity",
      "name": "Celková nosnost systému a příprava na brašny (Bikepacking / Nosiče)",
      "category": "Praktičnost & Nosnost",
      "importance": "recommended",
      "rationale": "Běžná kola mají celkovou nosnost rámu 110–120 kg včetně kola. Pro těžší jezdce nebo vícedenní výpravy s brašnami je nutné kolo s certifikovanou nosností 135–150 kg.",
      "icon": "🎒",
      "suggestedComponent": "chips",
      "suggestedValues": ["Zvýšená nosnost 130–150 kg (těžší jezdec / brašny)", "Příprava rámu na montáž blatníků a expedičních nosičů", "Běžná sportovní nosnost do 115 kg"]
    },
    {
      "id": "brand_preferences",
      "name": "Značka & Výrobci (Preferované vs. Zakázané)",
      "category": "Značky & Výrobci",
      "importance": "recommended",
      "rationale": "Umožňuje vám preferovat prověřené výrobce s dostupným servisem a zárukou (např. Trek, Specialized, Canyon, Scott, Ghost) a naopak striktně zakázat nespolehlivé značky. Otázka pro vás: Máte oblíbené značky, nebo chcete nějaké vyloučit?",
      "icon": "🏷️",
      "suggestedComponent": "brands",
      "suggestedValues": ["Otevřený výběr ze všech ověřených značek", "Preferuji specifické značky", "Chci vyloučit určité výrobce"]
    }
  ],
  "suggestedAlternatives": [
    {
      "id": "bike_dropper_post",
      "name": "Teleskopická sedlovka ovládaná z řídítek",
      "category": "Komfort & Bezpečnost v terénu",
      "importance": "preference",
      "rationale": "Umožňuje snížit sedlo za jízdy před prudkým sjezdem, což radikálně snižuje riziko pádu přes řídítka.",
      "icon": "📏",
      "suggestedComponent": "chips",
      "suggestedValues": ["Požaduji teleskopickou sedlovku (pro jistotu ve sjezdech)", "Pevná klasická sedlovka"]
    },
    {
      "id": "bike_service_warranty",
      "name": "Záruka a servis",
      "category": "Záruka & Podpora",
      "importance": "preference",
      "rationale": "Značky jako Trek či Specialized nabízejí prvnímu majiteli doživotní záruku na rám.",
      "icon": "🛡️",
      "suggestedComponent": "chips",
      "suggestedValues": ["Doživotní záruka na rám od výrobce", "Běžná 2-3letá záruka"]
    }
  ],
  "questions": [
    {
      "id": "bike_q_type",
      "step": 1,
      "title": "V jakém terénu a na jakých površích budete na kole jezdit?",
      "subtitle": "Klíčové elementární rozdělení určující celou geometrii a typ rámu.",
      "component": "chips",
      "isMultiSelect": false,
      "options": [
        { "label": "Gravel / Šotolina, cyklostezky a asfalt", "value": "gravel", "description": "Berany řídítka, rychlost na asfaltu i polních cestách." },
        { "label": "Horské kolo (MTB) / Lesní cesty, kameny a traily", "value": "mtb", "description": "Široká řídítka, odpružená vidlice, maximální jistota v terénu." },
        { "label": "Elektrokolo (E-bike) / Pomoc do kopců", "value": "ebike", "description": "Středový motor pro zdolání prudkých stoupání bez vyčerpání." }
      ],
      "defaultValue": "gravel",
      "promptForgeTemplate": "- **Typ kola a povrch jízdy:** {value}"
    },
    {
      "id": "bike_q_biometrics",
      "step": 2,
      "title": "Jaká je vaše výška, váha a máte zdravotní omezení?",
      "subtitle": "Určuje přesnou velikost rámu, dimenzování odpružení a ergonomii posedu.",
      "component": "chips",
      "isMultiSelect": false,
      "options": [
        { "label": "Standardní postava bez omezení", "value": "standard", "description": "Sportovní posed a běžné nastavení odpružení." },
        { "label": "Vyšší hmotnost (90+ kg) / Vyšší postava", "value": "heavy", "description": "Požadavek na vyšší tuhost rámu, vzduchovou vidlici a silné brzdy." },
        { "label": "Zdravotní limity (bolavá záda / kolena po operaci)", "value": "orthopedic", "description": "Požadavek na vzpřímenější geometrii a šetrné odpružení pro páteř." }
      ],
      "defaultValue": "standard",
      "promptForgeTemplate": "- **Biometrie a zdravotní profil jezdce:** {value}"
    }
  ],
  "systemPrompt": "Expertní nezávislý nákupní poradce pro jízdní kola. Doporučuje přesně 3 konkrétní modely dle disciplíny, biometrie a rozpočtu."
}

## PRAVIDLA PRO VÝSTUP (MANDATORY):
1. 📛 KRÁTKÉ NÁZVY PARAMETRŮ: Pole "name" u každého parametru MUSÍ BÝT MAXIMÁLNĚ 4 SLOVA. Žádné závorky, žádné technické zkratky v závorce, žádné spojky "vs." nebo "&". Správně: "Typ kola", "Materiál rámu", "Záruka a servis". Špatně: "Typ kola & disciplína (Silniční vs. Gravel vs. Horské MTB)".
2. 📋 BOHATÉ MOŽNOSTI: Pole "suggestedValues" musí mít MINIMÁLNĚ 3 A MAXIMÁLNĚ 5 konkrétních, dobře popsaných možností. Každá možnost může obsahovat krátký popis v závorce pro kontext. Nikdy méně než 3 možnosti.
3. ✅ Výstup musí být STRIKTNĚ validní JSON bez jakéhokoliv markdownu nebo komentářů.

Nyní zpracuj uživatelský dotaz: "${categoryQuery}".
Vygeneruj MINIMÁLNĚ 10 AŽ 14 takových špičkových parametrů seřazených od tržního zařazení přes biometrii až po technické detaily + 3 až 5 alternativních do poolu návrhů.
Odpověz STRIKTNĚ jako validní JSON podle výše uvedené struktury, bez jakéhokoliv doplňkového markdownového textu.
`.trim();

  // Route according to provider
  if (providerId === 'openai_gpt4o' || apiKey.startsWith('sk-proj-') || apiKey.startsWith('sk-')) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Jsi Luke – elitní Parameter Research Agent pro hloubkovou analýzu nákupních rozhodnutí, recenzí a odborných fór. Vždy dodržuješ elementární tržní segmentaci jako 1. parametr, biometrii uživatele a minimálně 10 parametrů. Odpovídáš výhradně validním JSONem.',
            },
            { role: 'user', content: metaPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content) as DomainAnalysisResult;
        }
      }
    } catch (err) {
      console.warn('OpenAI research call failed, trying Gemini:', err);
    }
  }

  // Default to Google Gemini API with model cascading (gemini-3.6-flash, 2.5-flash, 2.0-flash, 1.5-flash)
  const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: metaPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 5000,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
          return JSON.parse(cleanJson) as DomainAnalysisResult;
        }
      } else {
        lastError = new Error(`Gemini API error for model ${model}: ${response.status}`);
      }
    } catch (err: any) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  return null;
}
