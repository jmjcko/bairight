import { 
  BiomechanicalProfile, 
  AgentChatMessage, 
  ShoeRecommendation 
} from './types';
import { 
  evaluateMandatoryBiomechanicalParameters, 
  extractBiomechanicalProfileUpdates 
} from './state-machine';
import { searchRunningForums } from './tools/search-forums';
import { scanEuropeanEshops } from './tools/scan-eshops';
import { ProfileStorageManager } from '../storage/profile-storage';

export interface AgentExecutionResponse {
  message: AgentChatMessage;
  updatedProfile: BiomechanicalProfile;
  isReady: boolean;
  missingFields: (keyof BiomechanicalProfile)[];
}

export async function processAgentConversation(
  sessionId: string,
  userText: string
): Promise<AgentExecutionResponse> {
  const currentProfile = ProfileStorageManager.getProfile(sessionId);

  // 1. Extract updates from user input
  const { updatedProfile, injuriesAcknowledged } = extractBiomechanicalProfileUpdates(userText, currentProfile);
  ProfileStorageManager.updateProfile(sessionId, updatedProfile);

  // Save user message to history
  const userMsg: AgentChatMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content: userText,
    timestamp: new Date().toISOString(),
  };
  ProfileStorageManager.addMessage(sessionId, userMsg);

  // 2. Evaluate mandatory biomechanical guardrails
  const evalResult = evaluateMandatoryBiomechanicalParameters(updatedProfile, injuriesAcknowledged);

  // 3. Branching based on State Machine or explicit user intent
  const isAsking10 = 
    /(?:10|deset)\s*(?:parametr|krit[eé]r|bod|v[eě]c)|(?:chci|dej|uka[zž]|napi[sš])\s*(?:jich\s*)?10/i.test(userText) ||
    userText.trim() === '10' ||
    (userText.toLowerCase().includes('10') && (userText.toLowerCase().includes('parametr') || userText.toLowerCase().includes('chci') || userText.toLowerCase().includes('rekl')));

  if (isAsking10) {
    const assistantContent = generate10ParametersShoeGuide(updatedProfile);
    const assistantMsg: AgentChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };
    ProfileStorageManager.addMessage(sessionId, assistantMsg);

    return {
      message: assistantMsg,
      updatedProfile,
      isReady: false,
      missingFields: evalResult.missingFields,
    };
  }

  if (!evalResult.isReady) {
    // Search tools remain strictly locked
    const assistantContent = generateClarifyingQuestions(evalResult.missingFields, updatedProfile);
    
    const assistantMsg: AgentChatMessage = {
      id: `asst-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
    };
    ProfileStorageManager.addMessage(sessionId, assistantMsg);

    return {
      message: assistantMsg,
      updatedProfile,
      isReady: false,
      missingFields: evalResult.missingFields,
    };
  }

  // 4. All 5 parameters are verified -> Trigger External Tools
  const toolExecutions: AgentChatMessage['toolCalls'] = [];

  // Tool 1: Community Forums Search
  const forumSearchQuery = `Grade 3 Knee Osteoarthritis ${updatedProfile.strike_type || 'supination'} 2E wide shoe recommendations`;
  const forumResults = await searchRunningForums({ query: forumSearchQuery });
  toolExecutions.push({
    id: `tool-call-forum-${Date.now()}`,
    toolName: 'searchRunningForums',
    status: 'completed',
    args: { query: forumSearchQuery },
    result: forumResults,
  });

  // Tool 2: European E-shops Scan
  const eshopResults = await scanEuropeanEshops({
    footWidth: 'wide_2e',
    kneeCondition: 'osteoarthritis_grade_3',
    strikeType: updatedProfile.strike_type || 'supination',
  });
  toolExecutions.push({
    id: `tool-call-eshop-${Date.now()}`,
    toolName: 'scanEuropeanEshops',
    status: 'completed',
    args: { 
      retailers: eshopResults.retailersScanned,
      filter: eshopResults.filterCriteria,
    },
    result: eshopResults,
  });

  // 5. Formulate Clinical Podiatrist Response
  const podiatricResponse = formulatePodiatricPrescription(updatedProfile, eshopResults.shoes);

  const finalAssistantMsg: AgentChatMessage = {
    id: `asst-${Date.now()}`,
    role: 'assistant',
    content: podiatricResponse,
    timestamp: new Date().toISOString(),
    toolCalls: toolExecutions,
    recommendations: eshopResults.shoes,
  };
  ProfileStorageManager.addMessage(sessionId, finalAssistantMsg);

  return {
    message: finalAssistantMsg,
    updatedProfile,
    isReady: true,
    missingFields: [],
  };
}

function generateClarifyingQuestions(
  missing: (keyof BiomechanicalProfile)[],
  profile: BiomechanicalProfile
): string {
  const parts: string[] = [];
  
  parts.push(`### 🩺 Biometrické vyhodnocení profilu\n`);
  parts.push(`Děkuji za zadání vašich parametrů. Jako váš biomechanický nákupčí obuvi bAIright se zaměřuji na maximální šetření kloubů a prevenci přetížení.\n`);

  if (profile.knee_condition === 'osteoarthritis_grade_3') {
    parts.push(`> ⚠️ **Důležité upozornění:** Eviduji diagnózu **artrózy kolene 3. stupně**. V tomto stadiu je klíčové tlumení nárazů, kolébková geometrie podrážky (rocker) a neutrální široká základna.\n`);
  }

  parts.push(`Než odemknu vyhledávání v evropských katalozích a běžeckých fórech, potřebuji ještě upřesnit **${missing.length} ${missing.length === 1 ? 'klíčový parametr' : missing.length < 5 ? 'klíčové parametry' : 'klíčových parametrů'}**:\n`);

  if (missing.includes('weight_kg')) {
    parts.push(`1. **Tělesná hmotnost (v kg):** Potřebujeme ji pro kalibraci hustoty mezipodešve, aby pěna pod vaší vahou neprošlápla.`);
  }
  if (missing.includes('foot_width')) {
    parts.push(`2. **Šířka chodidla:** Vyhovuje vám standardní šířka D, nebo potřebujete **široké kopyto 2E / extra široké 4E**? (Úzká bota stlačuje prsty a vede ke kompenzační rotaci v koleni).`);
  }
  if (missing.includes('strike_type')) {
    parts.push(`3. **Došlap a vedení chodidla:** Došlapujete na patu, střed nebo špičku? Máte supinaci (sešlapávání vnější hrany) nebo pronaci?`);
  }
  if (missing.includes('knee_condition')) {
    parts.push(`4. **Stav kolenního kloubu:** Můžete potvrdit, zda máte **artrózu kolene 3. stupně**, potíže s meniskem či jiné diagnózy?`);
  }
  if (missing.includes('past_injuries')) {
    parts.push(`5. **Prodělaná zranění či operace:** Měli jste plantární fasciitidu, zánět Achillovy šlachy nebo operaci menisku/vazů? (Pokud ne, stačí uvést „žádná zranění“).`);
  }

  parts.push(`\nDoplňte prosím tyto údaje a obratem vám zobrazím doporučené modely obuvi.`);
  return parts.join('\n');
}

function formulatePodiatricPrescription(
  profile: BiomechanicalProfile,
  shoes: ShoeRecommendation[]
): string {
  const strikeCzech = profile.strike_type === 'supination' 
    ? 'SUPINACE (VNĚJŠÍ HRANA)' 
    : profile.strike_type === 'heel_strike' 
    ? 'DOŠLAP NA PATU' 
    : profile.strike_type?.toUpperCase() || 'DOŠLAP NA PATU';

  const widthCzech = profile.foot_width === 'wide_2e' 
    ? 'ŠIROKÉ KOPYTO 2E' 
    : profile.foot_width === 'extra_wide_4e' 
    ? 'EXTRA ŠIROKÉ KOPYTO 4E' 
    : 'STANDARDNÍ ŠÍŘKA D';

  return `### 🩺 Biomechanický rozbor a doporučení obuvi

**Vyhodnocený profil:**
- **Hmotnost:** ${profile.weight_kg} kg (Vyžaduje vyšší absorpci rázů)
- **Šířka chodidla:** ${widthCzech} (Anatomické kopyto pro volnost prstů)
- **Mechanika došlapu:** ${strikeCzech} (Neutrální platforma bez tvrdého vnitřního klínu)
- **Stav kloubů:** **Artróza kolene (3. stupeň / pokročilá zátěž)**

---

#### 🔍 Shrnutí biomechanických požadavků:
Při **artróze kolene 3. stupně** dochází k úbytku kloubní chrupavky. Běžná obuv s vysokým dropem (10–12 mm) zvyšuje ohyb v koleni a stupňuje tlak na patelu.

Na základě analýzy běžeckých komunit a biomechanických pravidel:
1. **Kolébková geometrie (Rocker sole):** Plynulý oblouk podrážky přirozeně odvaluje chodidlo od paty k prstům a ulevuje kolenním extenzorům při odrazu.
2. **Střední sklon (drop 4–8 mm):** Vyvažuje zátěž mezi kolenním kloubem a Achillovou šlachou.
3. **Široké kopyto 2E:** Zabraňuje útlaku záprstních kůstek a zajišťuje, že chodidlo stabilně sedí na základně podešve.

---

### 🇪🇺 Doporučené modely obuvi skladem v Evropě (šířka 2E):
Níže naleznete modely splňující zadaná kritéria pro váš profil:
`.trim();
}

function generate10ParametersShoeGuide(profile: BiomechanicalProfile): string {
  const parts: string[] = [];
  parts.push(`### 👟 10 klíčových parametrů pro výběr správné obuvi\n`);
  
  if (profile.knee_condition === 'osteoarthritis_grade_3') {
    parts.push(`> ⚠️ **Zohlednění diagnózy:** Eviduji artrózu kolene 3. stupně. U parametrů kladu prioritní důraz na odlehčení kloubních chrupavek a plynulé odvalení kroku.\n`);
  }

  parts.push(`Tady je přehled 10 nejdůležitějších parametrů, které při výběru bot rozhodují o pohodlí, biomechanice a zdraví kloubů:\n`);
  parts.push(`1. **Šířka kopyta (Toebox & Width):** Standardní D, široké 2E nebo extra široké 4E pro volnost prstů a prevenci otlaků.`);
  parts.push(`2. **Úroveň a typ tlumení (Stack Height):** Výška a hustota mezipodešve pro absorpci nárazových sil při došlapu.`);
  parts.push(`3. **Drop (sklon pata–špička):** Rozdíl výšky mezi patou a špičkou v mm (nižší 4–6 mm šetří kolena, vyšší 8–12 mm šetří Achillovku).`);
  parts.push(`4. **Typ došlapu a podpora klenby:** Supinace (vnější hrana), pronace (vnitřní vtáčení) nebo neutrální vedení chodidla.`);
  parts.push(`5. **Kolébková geometrie (Rocker Sole):** Plynulý oblouk mezipodešve pro odvalení kroku bez nadměrného namáhání kolene.`);
  parts.push(`6. **Torzní tuhost a stabilita základny:** Šířka platformy a stabilita v krutu pro jistý krok bez vyvracení kotníku.`);
  parts.push(`7. **Hmotnost obuvi vs. tělesná hmotnost:** Kalibrace hustoty pěny podle hmotnosti běžce, aby pěna neprošlápla.`);
  parts.push(`8. **Trakce a vzorek podešve:** Hladká přilnavá pryž pro silnici vs. hluboký vícesměrný vzorek pro trail.`);
  parts.push(`9. **Svršek a fixace paty (Heel Counter):** Bezešvá prodyšná síťovina a pevné uzamčení paty proti vyzouvání a puchýřům.`);
  parts.push(`10. **Zdravotní kompatibilita & ortopedické vložky:** Dostatečná vnitřní hloubka a vyjímatelná stélka pro individuální vložky.\n`);
  parts.push(`Můžete si z nich vybrat ty, které jsou pro vás prioritní, nebo mi napište svůj rozpočet a typ aktivity a doporučím vám konkrétní modely!`);

  return parts.join('\n');
}
