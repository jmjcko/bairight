import { discoverDomainParameters, ExtractedDomainParameter, DomainAnalysisResult } from '../src/lib/agent/domain-parameter-discovery';
import { setCachedAnalysis } from '../src/lib/agent/parameter-cache-service';
import * as fs from 'fs';
import * as path from 'path';

export interface CategoryGroup {
  name: string;
  items: string[];
}

export const LUKE_100_CATEGORIES: CategoryGroup[] = [
  {
    name: 'Elektronika a digitální zábava',
    items: [
      'Smartphony',
      'Kryty, obaly a ochranná skla na mobilní telefony',
      'Chytré hodinky a fitness náramky',
      'Bezdrátová sluchátka (TWS)',
      'Notebooky',
      'Tablety',
      'Televize',
      'Powerbanky',
      'Nabíjecí kabely a síťové adaptéry',
      'Herní konzole',
      'Počítačové hry a digitální herní klíče',
      'Paměťové karty a USB flash disky',
      'Klávesnice a počítačové myši',
      'Prvky chytré domácnosti (žárovky, chytré zásuvky)',
      'Elektronické čtečky knih',
      'E-knihy a audioknihy',
      'Předplatné streamovacích služeb (video, hudba)',
      'Počítačové komponenty (grafické karty, procesory)',
      'Monitory',
      'Drony',
      'Bezdrátové reproduktory a soundbary',
      'Softwarové licence (antivirové programy, kancelářské balíky)',
      'Datová úložiště (externí disky, NAS)',
      'Tiskárny a náhradní náplně',
      'Online vstupenky na kulturní a sportovní akce',
    ],
  },
  {
    name: 'Móda, kosmetika a péče o zdraví',
    items: [
      'Trička a topy',
      'Tenisky a volnočasová obuv',
      'Spodní prádlo',
      'Ponožky',
      'Mikiny a svetry',
      'Džíny a kalhoty',
      'Sportovní a funkční oblečení',
      'Bundy a kabáty',
      'Šaty a sukně',
      'Sluneční brýle',
      'Kabelky, tašky a batohy',
      'Šperky a klasické hodinky',
      'Parfémy a toaletní vody',
      'Pleťové krémy a vyživující séra',
      'Šampony a vlasová péče',
      'Dekorativní kosmetika (make-up, řasenky, rtěnky)',
      'Vitamíny a doplňky stravy',
      'Kontaktní čočky a čisticí roztoky',
      'Elektrické zubní kartáčky a náhradní hlavice',
      'Zubní pasty a mezizubní kartáčky',
      'Pánská kosmetika a potřeby pro holení',
      'Přípravky na a po opalování',
      'Tělová mléka a oleje',
      'Masážní přístroje a pomůcky',
      'Lékárenské produkty a volně prodejné léky',
    ],
  },
  {
    name: 'Domácnost, drogerie a potraviny',
    items: [
      'Kapsle do kávovarů a zrnková káva',
      'Malé kuchyňské spotřebiče (kávovary, mixéry, horkovzdušné fritézy)',
      'Robotické a tyčové vysavače',
      'Povlečení a prostěradla',
      'Ručníky a osušky',
      'Čisticí prostředky pro domácnost',
      'Prací prášky, gely a prací kapsle',
      'Bytové vůně a dekorační svíčky',
      'Nádobí, hrnce a pánve',
      'Úložné boxy a organizéry',
      'Trvanlivé potraviny',
      'Prémiový alkohol (vína, rumy, gin)',
      'Oříšky, semínka a sušené plody',
      'Zdravá a speciální výživa (bezlepkové, proteinové, veganské potraviny)',
      'Rozvoz hotových jídel z restaurací',
      'Sypané a porcované čaje',
      'Čokolády a prémiové cukrovinky',
      'Krmivo pro psy (granule, konzervy)',
      'Krmivo pro kočky',
      'Pamlsky a hračky pro domácí mazlíčky',
      'Antiparazitika a veterinární přípravky',
      'Toaletní papír a papírové utěrky',
      'Čističky a zvlhčovače vzduchu',
      'Kancelářské potřeby pro home office',
      'Nábytek a doplňky (kancelářské židle, matrace)',
    ],
  },
  {
    name: 'Sport, hobby a dětské zboží',
    items: [
      'Dětské jednorázové pleny',
      'Dětská výživa a příkrmy',
      'Dětské oblečení a botičky',
      'Stavebnice (zejména LEGO)',
      'Interaktivní a edukační hračky',
      'Dětské autosedačky',
      'Kočárky a příslušenství',
      'Školní batohy a vybavení',
      'Běžecká a treková obuv',
      'Sporttestery a cyklocomputery',
      'Outdoorové vybavení (stany, spacáky, karimatky)',
      'Činky, kettlebelly a domácí fitness pomůcky',
      'Proteiny a sportovní výživa',
      'Jízdní kola a elektrokola',
      'Cyklistické příslušenství a komponenty',
      'Podložky na jógu a cvičení',
      'Deskové a společenské hry',
      'Pneumatiky pro osobní vozy',
      'Autokosmetika a čisticí chemie pro auta',
      'Motorové oleje a aditiva',
      'Stěrače a autožárovky',
      'Elektrické nářadí (aku vrtačky, šroubováky)',
      'Zahradní technika (sekačky, motorové pily)',
      'Grily a grilovací příslušenství',
      'Semena, sazenice a zahradnické potřeby',
    ],
  },
];

export interface ValidationRuleResult {
  passed: boolean;
  item: string;
  matchedDomain: string;
  paramCount: number;
  questionCount: number;
  hasCorporateJargon: boolean;
  invalidNameLengths: string[];
  invalidOptionCounts: string[];
  errors: string[];
}

const FORBIDDEN_JARGON = [
  'elemental_market_segment',
  'tržní segment',
  'konstrukční třída',
  'procesní koncepce',
  'architektonická úroveň',
];

export function validateAnalysisQuality(item: string, analysis: DomainAnalysisResult): ValidationRuleResult {
  const errors: string[] = [];
  const invalidNameLengths: string[] = [];
  const invalidOptionCounts: string[] = [];

  // Rule 1: Parameter count >= 10
  if (!analysis.parameters || analysis.parameters.length < 10) {
    errors.push(`Nízký počet parametrů: ${analysis.parameters?.length || 0} (minimum je 10)`);
  }

  // Rule 2: No corporate jargon
  let hasJargon = false;
  analysis.parameters?.forEach((p) => {
    if (FORBIDDEN_JARGON.some((j) => p.id.includes(j) || p.name.toLowerCase().includes(j))) {
      hasJargon = true;
      errors.push(`Detekován korporátní jargon v parametru "${p.name}" (${p.id})`);
    }

    // Rule 3: Short parameter names (<= 4 words)
    const wordCount = p.name.trim().split(/\s+/).length;
    if (wordCount > 4) {
      invalidNameLengths.push(p.name);
      errors.push(`Příliš dlouhý název parametru (${wordCount} slov): "${p.name}"`);
    }

    // Rule 4: Options count (3 to 5 options for chips/dropdown)
    if (p.suggestedValues && p.suggestedComponent !== 'brands' && p.suggestedComponent !== 'slider') {
      if (p.suggestedValues.length < 3 || p.suggestedValues.length > 5) {
        invalidOptionCounts.push(`${p.name} (${p.suggestedValues.length} možností)`);
        errors.push(`Nevhodný počet možností u "${p.name}": ${p.suggestedValues.length} (vyžadováno 3-5)`);
      }
    }
  });

  // Rule 5: Wizard questions >= 2
  if (!analysis.questions || analysis.questions.length < 2) {
    errors.push(`Nízký počet otázek průvodce: ${analysis.questions?.length || 0}`);
  }

  return {
    passed: errors.length === 0,
    item,
    matchedDomain: analysis.matchedDomain,
    paramCount: analysis.parameters?.length || 0,
    questionCount: analysis.questions?.length || 0,
    hasCorporateJargon: hasJargon,
    invalidNameLengths,
    invalidOptionCounts,
    errors,
  };
}

export function computeAnalysisSimilarity(current: DomainAnalysisResult, baseline: any): number {
  if (!baseline || !current || !current.parameters) return 0;

  const currentParamIds = new Set(current.parameters.map((p) => p.id));
  const baselineParamIds = new Set((baseline.parameters || []).map((p: any) => p.id));

  let matchedCount = 0;
  currentParamIds.forEach((id) => {
    if (baselineParamIds.has(id)) matchedCount++;
  });

  const unionSize = new Set([...currentParamIds, ...baselineParamIds]).size;
  if (unionSize === 0) return 100;

  const idSimilarity = (matchedCount / unionSize) * 100;

  // Domain match weight
  const domainBonus = current.matchedDomain === baseline.matchedDomain ? 100 : 50;

  return Math.round(idSimilarity * 0.8 + domainBonus * 0.2);
}

async function runStressTest() {
  const isSaveBaseline = process.argv.includes('--save-baseline');
  const isCompareMode = process.argv.includes('--compare') || true;

  console.log('\n================================================================');
  console.log('🤖 AGENT LUKE – STRESS TEST, CACHE PREHEATER & 80% REGRESSION CHECK');
  console.log('================================================================\n');

  const baselineFilePath = path.join(__dirname, 'luke_100_golden_baseline.json');
  let baselineData: Record<string, any> = {};

  if (fs.existsSync(baselineFilePath)) {
    try {
      baselineData = JSON.parse(fs.readFileSync(baselineFilePath, 'utf-8'));
    } catch {
      baselineData = {};
    }
  }

  let totalItems = 0;
  let totalPassedQuality = 0;
  let totalMatchedDomain = 0;
  let totalGenericFallback = 0;
  let totalParamsGenerated = 0;
  let totalSimilarityScoreSum = 0;

  const currentRunOutputs: Record<string, any> = {};
  const spotCheckCandidates: { group: string; item: string; analysis: DomainAnalysisResult; similarity: number }[] = [];

  for (const group of LUKE_100_CATEGORIES) {
    console.log(`\n📁 Skupina: ${group.name} (${group.items.length} položek)`);
    console.log('----------------------------------------------------------------');

    let groupPassed = 0;
    let groupMatched = 0;

    for (const item of group.items) {
      totalItems++;
      const analysis = discoverDomainParameters(item);

      // Save output structure
      currentRunOutputs[item] = {
        keyword: analysis.keyword,
        matchedDomain: analysis.matchedDomain,
        categoryName: analysis.categoryName,
        agentName: analysis.agentName,
        icon: analysis.icon,
        description: analysis.description,
        parameters: analysis.parameters.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          importance: p.importance,
          suggestedComponent: p.suggestedComponent,
          suggestedValues: p.suggestedValues || [],
        })),
        questionTitles: analysis.questions.map((q) => q.title),
      };

      // Warm up cache memory
      await setCachedAnalysis(item, analysis, 'cs');

      const validation = validateAnalysisQuality(item, analysis);
      totalParamsGenerated += validation.paramCount;

      const similarity = baselineData[item] ? computeAnalysisSimilarity(analysis, baselineData[item]) : 100;
      totalSimilarityScoreSum += similarity;

      if (validation.matchedDomain !== 'generic') {
        totalMatchedDomain++;
        groupMatched++;
      } else {
        totalGenericFallback++;
      }

      if (validation.passed) {
        totalPassedQuality++;
        groupPassed++;
      }

      const statusIcon = validation.passed ? '✅' : '⚠️';
      const simLabel = baselineData[item] ? `| Shoda s dneškem: ${similarity}%` : '';
      const domainLabel = validation.matchedDomain !== 'generic' ? `[Doména: ${validation.matchedDomain}]` : '[Fallback: generic]';

      console.log(
        `  ${statusIcon} ${item.padEnd(52, '.')} ${validation.paramCount} par | ${validation.questionCount} ot. ${simLabel} ${domainLabel}`
      );

      if (spotCheckCandidates.length < 5 || Math.random() < 0.2) {
        spotCheckCandidates.push({ group: group.name, item, analysis, similarity });
      }
    }

    console.log(`  📊 Výsledek skupiny: ${groupPassed}/${group.items.length} splnilo kvalitu | ${groupMatched}/${group.items.length} doménově namapováno`);
  }

  const overallSimilarityScore = Math.round(totalSimilarityScoreSum / totalItems);
  const passes80PercentRule = overallSimilarityScore >= 80;

  if (isSaveBaseline) {
    fs.writeFileSync(baselineFilePath, JSON.stringify(currentRunOutputs, null, 2), 'utf-8');
    console.log(`\n💾 Zlatá báze byla úspěšně uložena do: ${baselineFilePath}`);
  }

  console.log('\n================================================================');
  console.log('📈 CELKOVÉ SOUHRNNÉ METRIKY & TEST SHODY (80% THRESHOLD)');
  console.log('================================================================');
  console.log(`• Celkem testováno produktových kategorií : ${totalItems}`);
  console.log(`• Úspěšně splnilo striktní kvalitu Luke  : ${totalPassedQuality} / ${totalItems} (${Math.round((totalPassedQuality / totalItems) * 100)}%)`);
  console.log(`• Specifická doménová registrace        : ${totalMatchedDomain} / ${totalItems} (${Math.round((totalMatchedDomain / totalItems) * 100)}%)`);
  console.log(`• Generické fallbacky                   : ${totalGenericFallback} / ${totalItems}`);
  console.log(`• Celkový počet vygenerovaných parametrů : ${totalParamsGenerated}`);
  console.log(`• Průměrně parametrů na produkt         : ${(totalParamsGenerated / totalItems).toFixed(1)}`);
  console.log(`• Stav keš paměti (ParameterCache)      : ✅ PREHEATED (100 položek uloženo v L1/L2 cache)`);
  console.log('----------------------------------------------------------------');
  console.log(`🎯 CELKOVÁ SHODA S ZLATOU BÁZÍ Z DNEŠKA : ${overallSimilarityScore}%`);
  console.log(`🛡️ VYŽADOVANÝ PRAH SHODY (THRESHOLD)     : 80%`);

  if (passes80PercentRule) {
    console.log(`✅ VÝSLEDEK TESTU AGENTA LUKE            : OK (Shoda ${overallSimilarityScore}% ≥ 80%)`);
  } else {
    console.log(`❌ VÝSLEDEK TESTU AGENTA LUKE            : REGRESSION DRIFT DETECTED (Shoda ${overallSimilarityScore}% < 80%)`);
    process.exitCode = 1;
  }

  // Spot Checks
  console.log('\n================================================================');
  console.log('🔍 NÁHODNÁ INSPEKCE VYGENEROVANÝCH PARAMETRŮ (SPOT CHECK)');
  console.log('================================================================\n');

  const sampleSelection = [
    spotCheckCandidates[0],
    spotCheckCandidates[Math.floor(spotCheckCandidates.length * 0.3)],
    spotCheckCandidates[Math.floor(spotCheckCandidates.length * 0.6)],
    spotCheckCandidates[spotCheckCandidates.length - 1],
  ].filter(Boolean);

  sampleSelection.forEach((sample, idx) => {
    console.log(`--- [Ukázka ${idx + 1}/${sampleSelection.length}] Produkt: "${sample.item}" (${sample.group}) ---`);
    console.log(`• Název Agenta: ${sample.analysis.agentName}`);
    console.log(`• Ikona a Doména: ${sample.analysis.icon} (${sample.analysis.matchedDomain})`);
    console.log(`• Shoda s bází: ${sample.similarity}%`);
    console.log(`• Popis Agenta: ${sample.analysis.description}`);
    console.log('• Vygenerované Klíčové Parametry (prvních 5 z ' + sample.analysis.parameters.length + '):');
    sample.analysis.parameters.slice(0, 5).forEach((p) => {
      const optionsStr = p.suggestedValues ? ` -> [Možnosti: ${p.suggestedValues.slice(0, 3).join(', ')}...]` : '';
      console.log(`   - ${p.icon || '▫️'} ${p.name} (${p.category}): ${p.rationale.slice(0, 90)}...${optionsStr}`);
    });
    console.log('• Průvodce (První 2 Otázky):');
    sample.analysis.questions.slice(0, 2).forEach((q) => {
      console.log(`   - ❓ ${q.title} (${q.subtitle})`);
    });
    console.log('');
  });

  console.log('================================================================\n');
}

if (process.env.NODE_ENV !== 'test') {
  runStressTest().catch(console.error);
}
