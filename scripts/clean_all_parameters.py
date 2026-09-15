import re

with open("src/lib/agent/domain-parameter-discovery.ts", "r", encoding="utf-8") as f:
    text = f.read()

# Exact name replacements mapping
NAME_REPLACEMENTS = {
    "Využitelná kapacita baterie & reálný dálniční dojezd": "Reálný dojezd",
    "Rychlost DC nabíjení & Architektura (800V vs. 400V)": "Rychlost nabíjení",
    "Tepelné čerpadlo pro zimní provoz": "Tepelné čerpadlo",
    "Palubní AC nabíječka & Domácí wallbox": "Domácí nabíjení",
    "Chemie trakční baterie (LFP vs. NMC)": "Typ baterie",
    "Pohon náprav (Zadní pohon RWD vs. Dual Motor 4x4 AWD)": "Pohon náprav",
    "Automatický předehřev baterie před rychlonabíjením": "Předehřev baterie",
    "Inteligentní plánovač tras s obsazeností nabíječek": "Plánovač tras",
    "Typ karoserie a aerodynamický profil": "Typ karoserie",
    "Obousměrné nabíjení V2L (Vehicle-to-Load / 230V zásuvka)": "Zásuvka 230V (V2L)",
    "Podpora vzdálených aktualizací (Over-The-Air / OTA)": "Vzdálené aktualizace",
    "Typ karoserie & prostorové uspořádání": "Typ karoserie",
    "Typ pohonu & motorizace": "Typ motoru",
    "Pohon náprav (4x4 vs. 4x2)": "Pohon náprav",
    "Roční nájezd & profil typických tras": "Roční nájezd",
    "Velikost zavazadlového prostoru": "Objem kufru",
    "Stav vozidla, stáří & záruka": "Stav vozidla",
    "Bezpečnostní výbava & asistenty": "Bezpečnostní výbava",
    "Servisní náklady, spolehlivost & zůstatková hodnota": "Provozní náklady",
    "Cenový rozpočet & způsob pořízení": "Rozpočet",
    "Tažné zařízení & nosnost přívěsu": "Tažné zařízení",
    "Asistenční systémy řízení (ADAS & 360° kamera)": "Asistenty řízení",
    "Adaptivní světlomety (Matrix LED / Laser)": "Adaptivní světlomety",
    "Panoramatická prosklená střecha": "Panoramatická střecha",
    "Prémiové audio & bezdrátový CarPlay/Android Auto": "Audio a konektivita",
    "Typ došlapu & biomechanika": "Typ došlapu",
    "Povrch a převažující terén": "Převažující terén",
    "Šířka kopyta & anatomie chodidla": "Šířka chodidla",
    "Drop mezipodešve (sklon pata-špička)": "Drop mezipodešve",
    "Odolnost proti vodě (Gore-Tex / membrána)": "Voděodolnost",
    "Karbonový plát & tuhost podešve": "Karbonový plát",
    "Voděodolná membrána (Gore-Tex / GTX)": "Voděodolná membrána",
    "Karbonový / nylonový plát pro odraz": "Karbonový plát",
    "360° Reflexní bezpečnostní prvky": "Reflexní prvky",
    "Anatomicky široká špička (FootShape)": "Široká špička",
    "Způsob přípravy a technologie extrakce": "Způsob přípravy",
    "Náročnost čištění & odvápnění": "Čištění a údržba",
    "Regulace teploty extrakce (PID)": "Regulace teploty",
    "Rozměry na lince & hlučnost čerpadla": "Rozměry a hlučnost",
    "Příprava výběrové výběrové kávy": "Výběrová káva",
    "Displej & barevná přesnost": "Kvalita displeje",
    "Operační systém & ekosystém": "Operační systém",
    "Kapacita operační paměti (RAM)": "Operační paměť RAM",
    "Kapacita a rychlost SSD úložiště": "SSD úložiště",
    "Portová výbava & Thunderbolt": "Konektory a porty",
    "Chlazení & hlučnost ventilátorů": "Chlazení a hlučnost",
    "Jezdecký styl & geometrie (Street vs. Skatepark)": "Jezdecký styl",
    "Výška a šířka řídítek (vzhledem k výšce postavy)": "Rozměry řídítek",
    "Typ kompresního systému (SCS vs. IHC / HIC)": "Kompresní systém",
    "Průměr a tvrdost koleček (110 mm vs. 120 mm / 88A)": "Parametry koleček",
    "Materiál a tvar desky (Šířka & Box-cut vs. Peg-cut)": "Konstrukce desky",
    "Materiál řídítek (Chromoly 4130 ocel vs. Hliník vs. Titan)": "Materiál řídítek",
    "Celková hmotnost kompletu (Lehká vs. Robustní)": "Hmotnost kompletu",
    "Typ brzdy (Flex fender vs. Odpružená)": "Typ brzdy",
    "Hlavové složení & ložiska (Integrované & ABEC 9/11)": "Ložiska a hlavové složení",
    "Maximální nosnost & dimenzování vidlice": "Nosnost vidlice",
    "Součástí balení grindovací pegy": "Grindovací pegy",
    "Hrubost a přilnavost griptapu": "Griptape",
    "Šířka středu lyže pod vázáním (Waist Width)": "Šířka středu lyže",
    "Konstrukce jádra & výztuhy (Titanal vs. Karbon / Pěna)": "Konstrukce jádra",
    "Profil prohnutí (Tradiční Camber vs. Tip Rocker)": "Profil prohnutí",
    "Pokročilost lyžaře & Flex index tuhosti": "Pokročilost a tuhost",
    "Bezpečnostní vázání & kompatibilita GripWalk": "Vázání a GripWalk",
    "Délka lyží k výšce postavy": "Délka lyží",
    "Rozpočet na lyže včetně vázání (Kč)": "Rozpočet na lyže",
    "Úhel broušení boční hrany (87°/88° vs 89°)": "Úhel broušení hran",
    "Obnovovací frekvence (Hz)": "Frekvence displeje",
    "Audio rozhraní (eARC)": "Audio a eARC",
    "Chytrý systém (OS)": "Chytrý systém OS",
    "Filtrace pro alergiky (HEPA)": "Filtrace pro alergiky",
    "Kartáč proti namotávání vlasů": "Kartáč proti vlasům",
    "Navigace a senzory překážek": "Senzory a navigace",
    "Osvětlení prachu (LED)": "LED osvětlení hubice",
    "Kapacita bubnu (kg)": "Kapacita bubnu",
    "Typ motoru (Direct Drive)": "Typ motoru",
    "Opravitelnost ložisek vany": "Opravitelnost ložisek",
    "Automatické dávkování gelu": "Dávkování pracího gelu",
    "Velikost pouzdra a zápěstí": "Velikost pouzdra",
    "Přesnost GPS (Multi-Band)": "Přesnost GPS",
    "Tuhost matrace (H1–H5)": "Tuhost matrace",
    "Anatomické zóny (7 zón)": "Anatomické zóny",
    "Pratelný potah (60 °C)": "Pratelný potah",
    "Chladivá pěna proti pocení": "Chladivá pěna",
    "Topný faktor (SCOP) v mrazu": "Topný faktor v mrazu",
    "Ekologické chladivo (R290)": "Chladivo R290",
    "Hlučnost venkovní jednotky": "Hlučnost jednotky",
    "Zásobník teplé vody (TUV)": "Zásobník teplé vody",
    "Dotace Nová zelená úsporám": "Státní dotace NZÚ",
    "Navigace bez drátu (RTK)": "Satelitní navigace RTK",
    "Regulace pojezdu (Vario)": "Regulace pojezdu",
    "Uložení kol (ložiska)": "Ložiska kol",
    "Typ motoru / jádra a konstrukční standard (bezuhlíkový / měděné vinutí / tvrzené slitiny)": "Konstrukční třída",
    "Způsob ovládání (Fyzická mechanická tlačítka vs. Digitální displej / aplikace)": "Způsob ovládání",
    "Materiálové zpracování exponovaných dílů (Kovové převody / nerez vs. křehký plast)": "Materiály a odolnost",
    "Servis a náhradní díly v ČR": "Servis a náhradní díly",
    "Délka záruky & dostupnost autorizovaného servisu v ČR": "Záruka a servis",
    "Tichý provoz & akustický komfort": "Hlučnost a akustika",
}

for old_name, new_name in NAME_REPLACEMENTS.items():
    pattern = f"name: '{old_name}'"
    replacement = f"name: '{new_name}'"
    if pattern in text:
        text = text.replace(pattern, replacement)
    else:
        pattern2 = f'name: "{old_name}"'
        replacement2 = f'name: "{new_name}"'
        if pattern2 in text:
            text = text.replace(pattern2, replacement2)

print("Applied name replacements!")

# Ensure every suggestedValues with fewer than 3 options gets expanded
# Let's expand common 2-option patterns:
EXPANSIONS = {
    "['LFP (bezpečné nabíjení na 100 % denně)', 'NMC / NCA (maximální dojezd a hustota energie)']":
        "['LFP baterie (bezpečné nabíjení na 100 % denně a extrémní životnost)', 'NMC / NCA baterie (maximální dojezd a nejlepší výkon v mrazech)', 'Nerozhoduje / nechám si doporučit optimální typ dle využití']",
    "['Dual Motor (Pohon všech kol 4x4 AWD)', 'Jeden motor (Úsporný zadní pohon RWD)', 'Přední pohon (FWD)']":
        "['Dual Motor 4x4 AWD (maximální trakce na sněhu a blesková akcelerace)', 'Úsporný zadní pohon RWD (ideální vyvážení a delší dojezd)', 'Přední pohon FWD (pro klidnou a úspornou městskou jízdu)']",
    "['Automatický předehřev propojený s navigací', 'Manuální předehřev tlačítkem']":
        "['Automatický předehřev propojený s navigací (baterie je připravena před příjezdem k HPC)', 'Manuální předehřev tlačítkem v infotainmentu', 'Nepotřebuji předehřev (nabíjím primárně doma na AC wallboxu)']",
    "['Pokročilý EV plánovač tras (Tesla, Google Built-in, BMW)', 'Základní navigace (stačí mi Apple CarPlay / Android Auto)']":
        "['Pokročilý plánovač tras (automatické zastávky na nabíjení a živá obsazenost)', 'Základní vestavěná navigace', 'Používám výhradně Apple CarPlay / Android Auto (Waze, Google Maps)']",
    "['Automatická převodovka (komfort v kolonách)', 'Manuální převodovka (kontrola a nižší cena)']":
        "['Automatická převodovka (plynulý komfort a pohodlí v městských kolonách)', 'Manuální převodovka (přímá kontrola nad otáčkami a nižší servisní náklady)', 'Pádla pod volantem / sportovní režim řazení']",
    "['Klimatizace s tepelným čerpadlem (úspora dojezdu v zimě)', 'Standardní odporový PTC ohřev']":
        "['Úsporné tepelné čerpadlo (šetří až 30 % dojezdu při zimním vytápění)', 'Běžný elektrický PTC ohřev (vhodné pro kratší městské trasy)', 'Nezávislé předehřátí interiéru přes mobilní aplikaci']",
    "['Třífázová 11 kW palubní nabíječka', 'Jednofázová 7,4 kW', 'Ultrarychlá 22 kW AC nabíječka']":
        "['Třífázová 11 kW palubní nabíječka (standard pro plné nabití přes noc za 6–8 h)', 'Ultrarychlá 22 kW AC nabíječka (rychlé nabití u veřejných AC sloupků za 3–4 h)', 'Základní 7,4 kW jednofázová nabíječka']",
    "['800V architektura (10-80 % do 18 minut)', '400V standard (10-80 % za 28-35 minut)']":
        "['Ultrarychlá 800V architektura (nabití 10–80 % do 18 minut na dálničních HPC)', 'Ověřený 400V standard (nabití 10–80 % za 28–35 minut)', 'Nerozhoduje / preferuji šetrnější nabíjení nižším proudem']",
    "['V2L adaptér / zásuvka 230V s výkonem 3,6 kW', 'Bez podpory V2L']":
        "['Plná podpora V2L 230V (napájení spotřebičů, elektrokol a kempingového vybavení)', 'Základní 12V zásuvka v kufru postačí', 'Bez požadavku na externí 230V napájení']",
    "['Plná podpora OTA (vzdálené vylepšování funkcí vozu)', 'Základní aktualizace u dealera']":
        "['Plné Over-The-Air aktualizace (vzdálené vylepšování motoru, dojezdu a infotainmentu)', 'Běžné OTA aktualizace mapových podkladů a multimédií', 'Tradiční servisní aktualizace u autorizovaného dealera']",
    "['Špičkový velký fotosenzor s OIS pro dokonalé noční fotky bez šumu', 'Kvalitní standardní fotoaparát na momentky za denního světla']":
        "['Absolutní fotomobil s 1\" snímačem (velký senzor, OIS, RAW a noční fotky bez šumu)', 'Pokročilý fotoaparát s OIS (stabilizované rodinné fotky a děti v pohybu)', 'Běžný spolehlivý fotoaparát (postačí ostré denní fotky a momentky)', 'Zaměření na video a vlogging (4K/60fps HDR, plynulá stabilizace a čistý zvuk)']",
    "['Dlouhá softwarová podpora 5–7 let (dlouhodobá investice)', 'Stačí běžná podpora 2–3 roky']":
        "['Dlouhodobá podpora 5–7 let (Apple, Google Pixel, Samsung Galaxy – investice na dlouho)', 'Střední podpora 3–4 roky (běžná vyšší střední třída s pravidelnými záplatami)', 'Základní podpora 2 roky (telefon plánuji po 2 letech obměnit za nový)']",
    "['Baterie 5000+ mAh s rychlým nabíjením 65W+ a bezdrátovým Qi', 'Běžné nabíjení postačí']":
        "['Bleskové nabíjení 65W+ a bezdrátové Qi (nabito za 20 minut a magnetické podložky)', 'Maximální výdrž baterie 5000+ mAh (s jistotou zvládne 1,5 až 2 dny provozu)', 'Vyvážená celodenní výdrž s běžným nočním nabíjením (25–30W)', 'Podpora reverzního bezdrátového nabíjení (pro dobití hodinek či sluchátek na cestách)']",
    "['Adaptivní LTPO displej 1–120 Hz', 'Standardní 60Hz panel']":
        "['Adaptivní LTPO 1–120 Hz (dokonalá plynulost s automatickou úsporou baterie)', 'Rychlý 90Hz / 120Hz displej bez LTPO (plynulý obraz za dostupnější cenu)', 'Standardní 60Hz panel (postačí na běžné čtení a messaging)']",
    "['Plná vodotěsnost IP68 (odolá ponoření do vody)', 'Základní odolnost proti stříkající vodě']":
        "['Plná vodotěsnost IP68 (odolá ponoření do vody, silnému dešti i pádu do vany)', 'Základní odolnost IP54 (ochrana proti stříkající vodě a mírnému dešti)', 'Zvýšená mechanická odolnost (odolné tělo nebo prémiové sklo Gorilla Armor)', 'Běžná odolnost (telefon budu chránit vlastním ochranným pouzdrem)']",
    "['256 GB nebo 512 GB interní paměť (jistota do budoucna)', 'Základních 128 GB postačí']":
        "['256 GB úložiště + 8–12 GB RAM (optimální zlatý střed s rezervou na roky)', '512 GB nebo 1 TB (velká kapacita pro 4K/8K videa, RAW fotky a offline aplikace)', '128 GB interní paměť (postačí při ukládání fotek a videí do cloudu)']",
    "['Vyžaduji dedikovaný 3x až 5x optický teleobjektiv', 'Stačí hlavní fotoaparát a širokoúhlý']":
        "['Periskopický teleobjektiv 5x až 10x optický zoom (vzdálené detaily a sport)', 'Portrétní teleobjektiv 2x až 3x zoom (přirozené proporce tváře bez rybího oka)', 'Bez optického teleobjektivu (postačí mi širokoúhlý a hlavní fotoaparát)']",
    "['Požaduji plnou podporu eSIM', 'Stačí fyzický slot na nanoSIM']":
        "['Plná podpora eSIM (rychlé nahrání zahraničních datových tarifů online)', 'Kombinace Dual SIM (fyzická nanoSIM karta + druhá volitelná eSIM)', 'Pouze klasická fyzická nanoSIM karta']",
    "['Karbonový plát pro maximální odraz a rychlost', 'Tradiční mezipodešev bez plátu (přirozený pohyb)']":
        "['Karbonový plát po celé délce (maximální energetická návratnost a závodní tempo)', 'Nylonový / sklolaminátový plát (příjemnější flexe vhodná i pro trénink)', 'Klasická mezipodešev bez plátu (přirozený došlap a delší životnost pěny)']",
    "['Gore-Tex / nepromokavá membrána (podzim, zima, bláto)', 'Prodyšný svršek bez membrány (rychle schne, noha větrá)']":
        "['Gore-Tex / nepromokavá membrána (ochrana proti blátu, mokré trávě a sněhu)', 'Hustě tkaná vodoodpudivá síťovina DWR (dobrá prodyšnost s lehkou ochranou)', 'Ultraprodyšný letní svršek (dokonalé větrání v horku a rychlé vysychání)']",
    "['Výrazný vzorek (5-6 mm kolíky do bláta a měkkého terénu)', 'Univerzální gravel podrážka (asfalt i zpevněná lesní cesta)']":
        "['Hluboké 5–6mm drapáky (jistota v blátě, mokré trávě a strmém terénu)', 'Univerzální all-terrain vzorek 3–4 mm (lesní šotolina, polní cesty i asfaltové přejezdy)', 'Hladká silniční podrážka s odolnou pryží (maximální přilnavost na suchém i mokrém asfaltu)']",
    "['Plně automatické čištění mléčných cest párou', 'Manuální proplachování hadičky']":
        "['Plně automatické parní čištění mléčného okruhu po každé přípravě', 'Vyjímatelná karafka vhodná do myčky nádobí', 'Manuální proplach a čištění trysky']",
    "['Nastavitelná teplota po 1 °C (pro světle i tmavě praženou kávu)', 'Pevná standardní teplota (92 °C)']":
        "['Precizní PID regulace teploty po 1 °C (ideální pro světle pražená výběrová zrna)', 'Třístupňové nastavení teploty (Nízká / Střední / Vysoká)', 'Fixní tovární teplota extrakce 92 °C']",
    "['OLED / QD-OLED (dokonalá černá a nekonečný kontrast)', 'Mini-LED (vysoký jas pro světlé místnosti)', 'QLED / LED (dostupná klasika)']":
        "['OLED / QD-OLED (dokonalá černá a nekonečný kontrast pro večerní kino)', 'Mini-LED (extrémní jas 1500+ nitů a živé barvy pro prosvětlený obývák)', 'Kvalitní QLED / Direct LED (osvědčený standard s výborným poměrem ceny a výkonu)']",
    "['Pravých 100 Hz / 120 Hz panel s HDMI 2.1 pro konzole a sport', 'Běžný 50 Hz / 60 Hz panel pro zprávy a seriály']":
        "['Rychlý 120 Hz / 144 Hz panel s HDMI 2.1 (ideální pro PS5/Xbox a rychlý sport)', 'Střední třída s plynulým dopočtem pohybu (MEMC)', 'Standardní 60 Hz panel (postačí pro běžné televizní vysílání a seriály)']",
    "['Kvalitní integrovaný soundbar / podpora Dolby Atmos & eARC', 'Stačí základní zvuk (používám vlastní domácí kino)']":
        "['Podpora Dolby Atmos a DTS:X s HDMI eARC (připojení kvalitního soundbaru)', 'Prémiové vestavěné reproduktory se subwooferem (plný zvuk bez externích beden)', 'Základní stereo reproduktory (nenáročný poslech zpráv a pořadů)']",
    "['Direct Drive motor s přímým pohonem bubnu (tichý a bez řemene)', 'Standardní invertorový motor s řemenovým převodem']":
        "['Direct Drive s přímým pohonem na ose bubnu (minimální vibrace, ticho a dlouhá životnost)', 'Klasický invertorový motor s řemenem (tichý chod a nízká spotřeba)', 'Tradiční uhlíkový motor']",
    "['Rozebíratelná vana se šroubovanými ložisky (snadná a levná oprava po letech)', 'Svařovaná nerozebíratelná vana (běžný standard většiny levnějších značek)']":
        "['Rozebíratelná vana se šroubovanými ložisky (možnost levné výměny ložisek i po 8 letech)', 'Prémiová nerezová vana s prodlouženou zárukou (např. Miele)', 'Běžná svařovaná plastová vana (oprava po záruce se řeší výměnou celého bubnu)']",
    "['Plně automatické inteligentní dávkování i-DOS / TwinDos', 'Manuální dávkování do zásuvky']":
        "['Automatické dávkování tekutého pracího prostředku a aviváže (až na 20 praní)', 'Zásobník na prací kapsle a tekutý gel s manuálním plněním', 'Tradiční manuální zásuvka na prášek i gel']",
    "['Duální Multi-Band GPS (L1 + L5 pro maximální přesnost v lese a mezi budovami)', 'Standardní GPS']":
        "['Dvoufrekvenční Multi-Band GPS L1+L5 (přesné měření tempa v lese, horách i mezi mrakodrapy)', 'Standardní multi-GNSS (GPS, GLONASS, Galileo postačí pro běh v parku)', 'Základní GPS s delší výdrží baterie']",
    "['Vysoký topný faktor SCOP > 4.8 a garance výkonu při -15 °C', 'Běžný SCOP kolem 4.0']":
        "['Špičkový SCOP > 4.8 s technologií vstřikování par (plný výkon i při -20 °C)', 'Velmi dobrý SCOP 4.2–4.6 (optimální pro novostavby a zateplené domy v ČR)', 'Standardní SCOP kolem 3.8–4.0 (ekonomické řešení)']",
    "['Přírodní propan R290 (ekologické, vysoká výstupní teplota 75 °C pro radiátory)', 'Chladivo R32 / R410A']":
        "['Přírodní chladivo R290 propan (výstupní voda až 75 °C – ideální pro starší radiátory)', 'Moderní syntetické chladivo R32 (vysoká účinnost pro podlahové topení)', 'Osvědčené chladivo s dostupným servisem v ČR']",
    "['Integrovaný nerezový zásobník na 180-250 l uvnitř vnitřní jednotky', 'Externí samostatná akumulační nádrž a bojler']":
        "['Kompaktní vnitřní věž s integrovaným nerezovým bojlerem 180–230 l', 'Samostatný externí bojler 250–300 l (pro velkou rodinu s vanou)', 'Pouze vytápění bez ohřevu TUV (ohřev vody řešen samostatně)']",
    "['Bezobvodová navigace RTK / kamera / GPS (bez nutnosti pokládat drát v trávníku)', 'Klasický obvodový vodicí drát v zemi']":
        "['Satelitní navigace RTK s přesností na centimetry (instalace bez obvodového drátu)', 'Optická navigace s AI kamerou (rozpoznávání trávníku a překážek bez drátu)', 'Osvědčený obvodový vodicí kabel položený v zemi']",
    "['Plynulá regulace rychlosti pojezdu Vario na rukojeti', 'Pevná rychlost pojezdu (kolem 3.6 km/h)', 'Bez pojezdu (tlačená sekačka)']":
        "['Plynulá regulace rychlosti pojezdu Vario (přizpůsobení kroku v husté trávě a svahu)', 'Pevná jedna rychlost pojezdu (cca 3,6 km/h – standard pro rovné zahrady)', 'Bez pojezdu (lehká manuálně tlačená sekačka)']",
}

for old_vals, new_vals in EXPANSIONS.items():
    if old_vals in text:
        text = text.replace(old_vals, new_vals)
    else:
        # Normalize whitespace in search
        compact_old = re.sub(r"\s+", " ", old_vals)
        # Check if can match
        pass

with open("src/lib/agent/domain-parameter-discovery.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Saved updated domain-parameter-discovery.ts!")
