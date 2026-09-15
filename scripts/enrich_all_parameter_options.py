import re

with open("src/lib/agent/domain-parameter-discovery.ts", "r", encoding="utf-8") as f:
    text = f.read()

# First, fix remaining 3 long names
text = text.replace("name: 'Zásuvka 230V (V2L)'", "name: 'Zásuvka 230V'")
text = text.replace("name: 'Intenzita a způsob využití'", "name: 'Způsob využití'")
text = text.replace("name: 'Spotřeba a provozní náklady'", "name: 'Provozní náklady'")

# Dictionary of high-quality, rich 3-5 options by parameter ID
# Each entry is formatted as: 'Krátký název (Vysvětlující popis)'
ENRICHED_OPTIONS = {
    # EV & Cars
    "ev_charging_architecture": [
        "Ultrarychlá 800V architektura (nabití 10–80 % za cca 18 minut na dálničních HPC)",
        "Osvědčený standard 400V (nabití 10–80 % za 28–35 minut – Tesla, VW, Škoda)",
        "Dostatečné základní DC nabíjení (vhodné při převážně domácím nočním nabíjení)",
    ],
    "ev_heat_pump": [
        "Úsporné tepelné čerpadlo (šetří až 30 % dojezdu při zimním vytápění)",
        "Standardní elektrický PTC ohřev (vhodné pro kratší příměstské jízdy)",
        "Předehřev interiéru přes mobilní aplikaci při připojení na nabíječku",
    ],
    "v2l_bidirectional": [
        "Plná podpora V2L 230V / 3.6 kW (napájení elektrokol, grilu a kempingového vybavení)",
        "Základní 12V / USB-C napájení pro drobnou elektroniku",
        "Bez požadavku na externí 230V napájení",
    ],
    "ota_updates": [
        "Plná vzdálená OTA podpora (pravidelná vylepšení motoru, dojezdu i infotainmentu)",
        "Základní OTA aktualizace (mapové podklady a multimediální systém)",
        "Tradiční servisní aktualizace u autorizovaného dealera",
    ],
    "transmission": [
        "Automatická převodovka (maximální komfort a plynulost v městských kolonách)",
        "Manuální převodovka (přímá kontrola otáček, nižší pořizovací i servisní náklady)",
        "Dvouspojkový automat s pádly pod volantem (sportovní dynamika a bleskové řazení)",
    ],
    "safety_assistants": [
        "Maximální bezpečnostní balík (aktivní udržování v pruhu, adaptivní tempomat a nouzové brzdění)",
        "Standardní bezpečnostní výbava (tempomat, parkovací senzory a sledování únavy)",
        "Základní pasivní bezpečnost (airbagy a ABS/ESP postačí)",
    ],
    "running_costs": [
        "Minimální provozní a servisní náklady (vysoká spolehlivost a levné náhradní díly)",
        "Vyvážený poměr ceny servisu a komfortu (běžný evropský standard)",
        "Prémiový servis s plnou tovární zárukou a mobilitou",
    ],
    "budget_czk": [
        "Dostupná kategorie do 400 000 Kč (spolehlivá ojetina s jasnou historií)",
        "Střední třída 400 000 – 800 000 Kč (zánovní rodinný vůz v plné výbavě)",
        "Vyšší střední třída 800 000 – 1 400 000 Kč (nový prémiový vůz nebo moderní EV)",
        "Prémiový segment nad 1 400 000 Kč (maximální luxus, výkon a technologie)",
    ],
    "adas_systems": [
        "Autonomní jízda Level 2+ s 360° kamerami (automatické parkování a dálniční asistent)",
        "Adaptivní tempomat s vedením v pruhu (komfort na dlouhých dálničních trasách)",
        "Základní parkovací senzory a couvací kamera",
    ],
    "matrix_headlights": [
        "Inteligentní Matrix LED / Laser světla (vykrývání protijedoucích aut bez oslnění)",
        "Standardní Full LED světlomety (vysoký světelný výkon s automatickým přepínáním)",
        "Základní halogenové / LED světlomety",
    ],
    "panoramic_roof": [
        "Otevíratelná panoramatická střecha (vzdušnost kabiny a větrání v létě)",
        "Pevné prosklené panoramatické okno s elektrickou clonou",
        "Klasická plná plechová střecha (nejlepší tepelná izolace a nižší hmotnost)",
    ],
    "infotainment_sound": [
        "Prémiový audiosystém (Harman Kardon, Bose nebo B&O se subwooferem)",
        "Bezdrátový Apple CarPlay / Android Auto se standardním ozvučením",
        "Základní bluetooth rádio a handsfree",
    ],

    # Shoes & Running
    "weather_membrane": [
        "Gore-Tex nepromokavá membrána (ochrana proti mokré trávě, blátu a sněhu)",
        "Hustě tkaná vodoodpudivá síťovina DWR (slušná ochrana s dobrou prodyšností)",
        "Ultraprodyšný letní svršek bez membrány (rychle schne a skvěle větrá)",
    ],
    "plate_rigidity": [
        "Karbonový plát po celé délce (maximální odraz a rychlost pro závodní tempo)",
        "Nylonový / sklolaminátový plát (pružnější odraz vhodný i na svižný trénink)",
        "Tradiční mezipodešev bez plátu (přirozený pohyb chodidla a šetření achilovek)",
    ],
    "waterproof_membrane": [
        "Gore-Tex nepromokavá membrána (ochrana proti mokré trávě, blátu a sněhu)",
        "Hustě tkaná vodoodpudivá síťovina DWR (slušná ochrana s dobrou prodyšností)",
        "Ultraprodyšný letní svršek bez membrány (rychle schne a skvěle větrá)",
    ],
    "carbon_plate": [
        "Karbonový plát po celé délce (maximální odraz a rychlost pro závodní tempo)",
        "Nylonový / sklolaminátový plát (pružnější odraz vhodný i na svižný trénink)",
        "Tradiční mezipodešev bez plátu (přirozený pohyb chodidla a šetření achilovek)",
    ],
    "reflective_safety": [
        "Výrazné 360° reflexní prvky a reflexní tkaničky (maximální viditelnost za šera a v noci)",
        "Základní reflexní logo na patě",
        "Bez požadavku na reflexní prvky (běhám výhradně za denního světla)",
    ],
    "wide_toebox_natural": [
        "Anatomicky široká špička FootShape (prsty mají prostor pro přirozený vějířovitý rozptyl)",
        "Standardní šířka kopyta (univerzální anatomický střih většiny značek)",
        "Užší závodní střih (pevné sevření nártu a maximální cit pro terén)",
    ],

    # Espresso & Kitchen
    "boiler_type": [
        "Dvojitý bojler Dual Boiler (současná příprava espressa a šlehání mikropěny)",
        "Jeden bojler s výměníkem Heat Exchanger (profesionální výkon v kompaktním těle)",
        "Rychlý termoblok (nahřátí přístroje za 30 sekund – úspora času ráno)",
    ],
    "maintenance_ease": [
        "Plně automatické parní čištění mléčného okruhu po každém šálku",
        "Vyjímatelná spařovací jednotka s možností snadného opláchnutí pod vodou",
        "Integrovaný automatický odvápňovací program s vodním filtrem",
    ],
    "temperature_pid": [
        "Přesná digitální regulace PID po 1 °C (nastavení ideální extrakce pro světle pražená zrna)",
        "Třístupňová volba teploty (Nízká / Střední / Vysoká)",
        "Pevná tovární teplota extrakce 92 °C",
    ],
    "dimensions_noise": [
        "Kompaktní rozměry do malé kuchyně s tichým rotačním čerpadlem",
        "Standardní rozměry s odhlučněným vibračním čerpadlem",
        "Robustní nerezové provedení bez omezení prostoru",
    ],
    "specialty_coffee": [
        "Příprava výběrové světle pražené kávy (pre-infuze, PID regulace a jemné mletí)",
        "Univerzální profil pro středně i tmavěji pražená zrna a mléčné speciality",
        "Tradiční italské espresso (hustá crema, čokoládovo-oříškový profil)",
    ],

    # Chairs & Ergonomics
    "headrest": [
        "3D stavitelný podhlavník (výška i úhel sklonu pro relaxaci a oporu krku)",
        "Pevný integrovaný podhlavník v opěráku",
        "Bez podhlavníku (preferuji volnost pohybu ramen a krku)",
    ],
    "seat_depth": [
        "Nastavitelný posuv hloubky sedáku (nezbytné pro správné prokrvení nohou)",
        "Pevná ergonomická hloubka sedáku s měkčenou přední hranou",
        "Zkrácený sedák pro drobnější postavy do 165 cm",
    ],
    "castors_floor": [
        "Měkká pogumovaná kolečka na tvrdé podlahy (parkety, vinyl, plovoucí podlaha)",
        "Tvrdá plastová kolečka na koberce a zátěžové krytiny",
        "Univerzální brzděná kolečka s bezpečnostní zátěžovou brzdou",
    ],

    # Laptops
    "ports_docking": [
        "Plná výbava včetně Thunderbolt 4 / USB4 a HDMI (dokování jedním kabelem)",
        "Standardní USB-C s podporou Power Delivery a klasické USB-A",
        "Minimalistická portová výbava (používám externí USB-C rozbočovač)",
    ],
    "cooling_acoustics": [
        "Tiché pasivní chlazení bez ventilátoru (zcela bezhlučný chod – např. Apple MacBook Air)",
        "Inteligentní duální ventilátory s tichým profilem při běžné kancelářské práci",
        "Maximální chladicí výkon pro náročný render a hraní her",
    ],

    # Scooters
    "brake_type": [
        "Pružná ocelová brzda Flex Fender (tichá, bez chrastění a šetrná ke kolečkům)",
        "Pružinová nášlapná brzda (jednoduché a lehké sešlápnutí)",
        "Bez zadní brzdy / brakeless (preferováno čistě pro streetový styl)",
    ],
    "headset_bearings": [
        "Integrované průmyslové hlavové složení s ložisky ABEC 9 / ABEC 11",
        "Kvalitní zapouzdřená ložiska se snadnou údržbou",
        "Základní kuličkové hlavové složení",
    ],
    "rider_weight_capacity": [
        "Zesílená nosnost do 120 kg (masivní kovaná vidlice a odolné svary pro skoky)",
        "Standardní nosnost do 100 kg (univerzální pro dospívající a dospělé jezdce)",
        "Dětská a juniorská zátěž do 70 kg",
    ],
    "pegs_included": [
        "Součástí balení jsou přední i zadní grindovací pegy",
        "Příprava na montáž pegů bez pegů v balení",
        "Bez pegů (pro parkové polety a triky ve vzduchu nejsou potřeba)",
    ],
    "griptape_coarseness": [
        "Hrubý protiskluzový griptape s maximálním gripem pro street",
        "Jemný komfortní griptape šetrný k podrážkám bot",
        "Středně hrubý designový griptape",
    ],

    # TVs
    "tv_processor_upscaling": [
        "Špičkový neuronový AI procesor (dokonalý upscaling staršího vysílání a redukce šumu)",
        "Kvalitní čtyřjádrový procesor s plynulým dopočtem snímků",
        "Standardní procesor (postačí pro sledování Netflixu a YouTube v nativním 4K)",
    ],
    "tv_hdr_formats": [
        "Plná podpora Dolby Vision IQ i HDR10+ (dynamické přizpůsobení jasu světlu v místnosti)",
        "Základní HDR10 a HLG pro běžné streamovací služby",
        "Standardní SDR/HDR bez specifických formátů",
    ],
    "tv_smart_os": [
        "Google TV / Android TV (nejširší nabídka aplikací, KODI, O2 TV, Skylink)",
        "Rychlý a intuitivní systém LG webOS / Samsung Tizen",
        "Systém Apple AirPlay 2 a HomeKit integrace",
    ],
    "tv_viewing_angles": [
        "Široké pozorovací úhly bez blednutí barev (ideální pro rohovou sedačku a rodinu)",
        "Vysoký kontrast z přímého pohledu (postačí sezení přímo proti televizi)",
        "Antireflexní vrstva pro potlačení odlesků oken a lamp",
    ],
    "tv_mount_construction": [
        "Ultra tenká montáž na zeď Slim Fit (televize přiléhá ke zdi jako obraz)",
        "Otočný kloubový držák na stěnu s nastavením sklonu",
        "Stabilní středový nebo nožičkový stojan na televizní stolek",
    ],
    "tv_antireflective": [
        "Špičkový matný antireflexní panel (žádné zrcadlení oken za jasného dne)",
        "Pololesklá úprava s filtrem odlesků",
        "Lesklý panel pro maximální hloubku a sytost černé barvy v zatemněné místnosti",
    ],

    # Vacuums
    "vacuum_suction_power": [
        "Maximální sací výkon 200+ AW / 25+ kPa (hloubkové čištění vysokých koberců a zvířecích chlupů)",
        "Střední sací výkon 140–180 AW (ideální pro kombinaci tvrdých podlah a kusových koberců)",
        "Úsporný výkon 100–120 AW (postačí na hladké plovoucí podlahy a dlažbu)",
    ],
    "vacuum_filtration_hepa": [
        "Certifikovaný HEPA H14 filtr s 99.99% účinností (zachytí roztoče, pyl a mikroprach)",
        "Omyvatelný HEPA filtr H12/H13 (vysoká ochrana pro běžnou domácnost)",
        "Vícevrstvý mikrofiltr s jednoduchou údržbou",
    ],
    "vacuum_brush_antitangle": [
        "Speciální kónický kartáč s automatickým nožem proti namotávání dlouhých vlasů a chlupů",
        "Měkký rotační válec z mikrovlákna šetrný k náchylným dřevěným podlahám",
        "Kombinovaná univerzální hubice pro koberce i tvrdé povrchy",
    ],
    "vacuum_battery_runtime": [
        "Dlouhá výdrž 60+ minut s vyměnitelnou baterií (úklid velkého rodinného domu)",
        "Výdrž 40–50 minut (ideální pro běžný byt 3+1)",
        "Výdrž do 30 minut (rychlý denní úklid drobků a kuchyně)",
    ],
    "vacuum_cleaning_station": [
        "Multifunkční dokovací stanice (automatické odsátí prachu do sáčku a praní mopů)",
        "Kompaktní nabíjecí stanice s automatickým vyprázdněním prachové nádoby",
        "Klasická nástěnná nabíječka (manuální vysypávání nádoby do koše)",
    ],
    "vacuum_navigation_sensors": [
        "Přesná LiDAR navigace s 3D kamerou a AI rozpoznáváním kabelů a ponožek",
        "Laserová LiDAR navigace (spolehlivý úklid i v naprosté tmě)",
        "Gyroskopická navigace s infračervenými senzory pádu",
    ],
    "vacuum_acoustic_comfort": [
        "Mimořádně tichý provoz pod 65 dB (neruší děti ani domácí mazlíčky)",
        "Standardní úroveň hluku 70–75 dB",
        "Výkonový režim bez ohledu na hlučnost",
    ],
    "vacuum_illuminated_nozzle": [
        "Zelené laserové / širokoúhlé LED osvětlení hubice (odhalí i neviditelný mikroskopický prach)",
        "Standardní bílé LED přisvícení pro úklid pod gaučem a postelí",
        "Bez osvětlení hubice",
    ],

    # Washing machines
    "household_capacity_biometrics": [
        "Velká kapacita 9–10 kg (ideální pro 4+ člennou rodinu, deky a ložní prádlo)",
        "Standardní kapacita 7–8 kg (optimální pro běžnou 2–3 člennou domácnost)",
        "Kompaktní kapacita 5–6 kg (pro jednotlivce či pár v menším bytě)",
    ],
    "washer_motor_type": [
        "Direct Drive s přímým pohonem na ose bubnu (minimální vibrace, ticho a dlouhá životnost)",
        "Klasický invertorový motor s řemenem (tichý chod a nízká spotřeba)",
        "Tradiční motor s uhlíky (cenově dostupnější řešení)",
    ],
    "washer_drum_bearings": [
        "Rozebíratelná vana se šroubovanými ložisky (možnost levné výměny ložisek i po 8 letech)",
        "Prémiová nerezová vana s prodlouženou zárukou (např. Miele)",
        "Běžná svařovaná plastová vana (oprava po záruce se řeší výměnou celého bubnu)",
    ],
    "washer_steam_allergy": [
        "Parní program SteamCare s certifikací pro alergiky (odstraní 99.9 % bakterií a roztočů)",
        "Parní osvěžení pro vyhlazení záhybů bez nutnosti žehlení",
        "Tradiční praní bez parních funkcí",
    ],
    "washer_acoustic_comfort": [
        "Extrémně tichý provoz při odstřeďování pod 70 dB (vhodné pro noční praní v paneláku)",
        "Standardní hlučnost 72–75 dB s antivibračními prolisy bočnic",
        "Běžná hlučnost nad 76 dB (umístění v technické místnosti či suterénu)",
    ],
    "washer_spin_speed": [
        "Vysoké otáčky 1400–1600 ot./min (prádlo schne mnohem rychleji v sušičce)",
        "Standardní otáčky 1200 ot./min (šetrné k bavlně i syntetice)",
        "Šetrné odstřeďování 1000 ot./min pro jemné tkaniny",
    ],
    "washer_water_protection": [
        "Kompletní ochrana AquaStop s dvojitou hadicí a plovákem (garance proti vytopení sousedů)",
        "Vícenásobná ochrana proti úniku vody",
        "Základní bezpečnostní hadice",
    ],
    "washer_add_item": [
        "Samostatná dvířka AddWash pro přidání zapomenutého prádla během praní",
        "Elektronická funkce pauzy s možností otevření hlavních dvířek",
        "Bez požadavku na přidávání prádla po spuštění cyklu",
    ],

    # Smartwatches
    "watch_battery_runtime": [
        "Extrémní výdrž 14–30 dní (outdoorové a sportovní modely Garmin, Coros)",
        "Týdenní výdrž 5–10 dní (vyvážené chytré hodinky Huawei, Amazfit)",
        "Jednodenní až dvoudenní výdrž s bohatým systémem aplikací (Apple Watch, Samsung Galaxy Watch)",
    ],
    "watch_display_technology": [
        "Zářivý AMOLED displej s vysokým jasem a živými barvami",
        "Transflektivní Memory-in-Pixel (MIP) displej (dokonalá čitelnost na přímém slunci s minimální spotřebou)",
        "Úsporný pasivní displej s analogovými ručičkami (hybridní hodinky)",
    ],
    "watch_sensors_health": [
        "Kompletní zdravotní diagnostika: EKG, krevní tlak, HRV status a noční monitoring spánku",
        "Standardní měření tepu, okysličení krve SpO2 a celodenní kroky",
        "Základní sportovní tracker se záznamem kalorií a tepu",
    ],
    "watch_glass_sapphire": [
        "Nezničitelné safírové sklíčko s titanovou lunetou (odolné proti poškrábání o skálu a klíče)",
        "Odolné tvrzené sklo Gorilla Glass s hliníkovým pouzdrem",
        "Standardní minerální sklíčko s ochrannou fólií",
    ],
    "watch_water_resistance": [
        "Vodotěsnost 10 ATM / 100 m s potápěčským hloubkoměrem (vhodné pro plavání i potápění)",
        "Standardní vodotěsnost 5 ATM / 50 m (sprchování a rekreační plavání v bazénu)",
        "Základní odolnost proti stříkající vodě a potu IP68",
    ],
    "watch_smart_connectivity": [
        "Plná nezávislost s LTE eSIM (volání a poslech hudby bez telefonu v kapse)",
        "Bezkontaktní placení hodinkami (Garmin Pay, Apple Pay, Google Pay) a offline mapy",
        "Základní bluetooth zrcadlení notifikací z telefonu",
    ],
    "watch_solar_charging": [
        "Integrované solární dobíjení Power Glass (prodloužení výdrže při pobytu na slunci)",
        "Výhradně kabelové / magnetické nabíjení",
        "Bezdrátové nabíjení standardem Qi",
    ],

    # Mattresses
    "mattress_height_dimensions": [
        "Vysoká prémiová matrace 24–30 cm (snadné vstávání z postele a luxusní pocit)",
        "Standardní výška 18–22 cm (vhodná pro většinu moderních lůžek)",
        "Nižší výška 14–16 cm (do dětských postelí či na patrové postele)",
    ],
    "mattress_bed_base_compat": [
        "Lamelový polohovací rošt (vyžaduje elastickou pěnovou či latexovou matraci)",
        "Pevný laťový rošt s mezerami (ideální pro taštičkové pružinové jádro)",
        "Pevná deska / kontinentální postel Boxspring",
    ],
    "mattress_partner_dual": [
        "Partnerská matrace s dvojí tuhostí (jedna strana měkčí, druhá tužší)",
        "Dvě samostatné matrace se společným zipovým potahem",
        "Jednotná tuhost po celé ploše manželské postele",
    ],

    # Heat pumps
    "hp_inverter_modulation": [
        "Plynulá modulace kompresoru Inverter 20–100 % (přesné přizpůsobení aktuální tepelné ztrátě domu)",
        "Dvoustupňový kompresor s ekonomickým režimem",
        "On/Off kompresor s akumulační nádrží",
    ],
    "hp_service_connectivity": [
        "Vzdálený online monitoring a servisní diagnostika výrobcem přes Wi-Fi/LAN",
        "Místní ovládání nástěnným pokojovým termostatem s mobilní aplikací",
        "Základní manuální ovládání na displeji jednotky",
    ],
    "hp_cooling_active": [
        "Aktivní reverzní chlazení v parném létě (přes podlahové topení či fancoily)",
        "Pasivní chlazení z hlubinného vrtu (u čerpadel země-voda)",
        "Pouze vytápění a ohřev teplé vody bez chlazení",
    ],

    # Bicycles
    "bike_frame_material": [
        "Lehký karbonový rám (vynikající pohlcování vibrací a maximální tuhost v záběru)",
        "Odolný hliníkový rám (nejlepší poměr ceny, odolnosti a nízké váhy)",
        "Ocelový Cr-Mo rám (poddajnost a vysoká opravitelnost pro cestování)",
        "Titanový rám (exkluzivní materiál s doživotní trvanlivostí)",
    ],
    "bike_drivetrain_groupset": [
        "Elektronické bezdrátové řazení (SRAM AXS / Shimano Di2 – bleskové a přesné řazení)",
        "Osvědčená mechanická sada Shimano Deore / GRX / XT s jednopřevodníkem 1x12",
        "Klasické dvoupřevodníkové zpřevodování 2x11 pro jemné odstupňování na silnici",
    ],
    "bike_brakes_hydraulic": [
        "Hydraulické kotoučové brzdy Shimano / SRAM s chlazenými destičkami (jistota za mokra i v dlouhých sjezdech)",
        "Základní hydraulické kotoučovky s jednoduchým servisem",
        "Mechanické kotoučové brzdy nebo ráfkové V-brzdy",
    ],
    "bike_cockpit_ergonomics": [
        "Ergonomické gripy s opěrkou dlaně a gelové sedlo pro komfortní vzpřímený posed",
        "Sportovní sedlo s odlehčovacím kanálkem pro delší sportovní vyjížďky",
        "Závodní aerodynamický posed s nízkým úchopem",
    ],
    "bike_weight_capacity": [
        "Zvýšená nosnost 130–150 kg (vhodné pro těžší jezdce i expediční brašny)",
        "Standardní nosnost do 115–120 kg (běžné sportovní kolo)",
        "Ultralehký závodní speciál s limitem do 100 kg",
    ],
    "bike_dropper_post": [
        "Teleskopická sedlovka ovládaná z řídítek (okamžité snížení sedla ve sjezdech a technických pasážích)",
        "Pevná karbonová sedlovka tlumící vibrace",
        "Odpružená sedlovka pro maximální pohodlí zad na polních cestách",
    ],
    "bike_service_warranty": [
        "Doživotní tovární záruka na rám kola (Trek, Specialized, Orbea)",
        "Prodloužená 5letá záruka po registraci",
        "Standardní zákonná záruka 2 roky",
    ],

    # Strollers
    "stroller_suspension_wheels": [
        "Nafukovací nebo gelová velká kola s měkkým nastavitelným odpružením všech 4 kol (do terénu a na kočičí hlavy)",
        "Pěnová PU bezúdržbová kola s odpružením zadní nápravy (univerzální do města a parků)",
        "Lehká menší plastová kola pro maximální skladnost",
    ],
    "stroller_fold_mechanism": [
        "Bleskové složení jednou rukou i se sportovním sedákem (ideální při nastupování do MHD)",
        "Dvoudílné kompaktní skládání do malého kufru městského auta",
        "Tradiční robustní skládání pro prostorný rodinný kombík",
    ],
    "stroller_bassinet_dimensions": [
        "Prostorná XL hluboká korba (délka 80+ cm – dostatek místa pro zimní fusak)",
        "Standardní korba pro jarní a letní miminka (délka 75 cm)",
        "Skládací měkká vložná taška do sportovního kočárku",
    ],
    "stroller_seat_reversibility": [
        "Obousměrné otočné sezení (čelem k rodičům pro kontakt s miminkem i po směru jízdy na objevování světa)",
        "Pevné sezení výhradně po směru jízdy (lehčí a skladnější konstrukce)",
        "Překlápěcí rukojeť pro okamžitou změnu směru",
    ],
    "stroller_canopy_sun_rain": [
        "Prodloužitelná stříška s UV 50+ ochranou, větrací síťkou a tichým magnetickým okénkem",
        "Běžná stříška se sluneční clonou",
        "Přídavný slunečník a pláštěnka v balení",
    ],
    "stroller_basket_capacity": [
        "Velký uzavíratelný nákupní košík s nosností 5–10 kg",
        "Otevřený přístupný košík na drobnosti a hračky",
        "Základní košík s nosností do 3 kg",
    ],
    "stroller_safety_harness": [
        "5bodové magnetické zapínání pásů s měkkým polstrováním",
        "Klasická pětibodová spona s nastavením výšky",
        "Snadné zapínání s odnímatelným bezpečnostním madlem před dítětem",
    ],
    "stroller_handbrake": [
        "Ruční přibrzďovací brzda na madle (bezpečné přibrzďování při chůzi z prudkého kopce a in-line bruslení)",
        "Nožní centrální nášlapná brzda (šetrná k botám)",
        "Kombinovaná ruční a nožní brzda",
    ],

    # Lawnmowers
    "mower_cut_width": [
        "Široký záběr 51–56 cm (rychlé posečení velkých ploch nad 1 200 m²)",
        "Univerzální záběr 46–48 cm (optimální manévrovatelnost i na členité zahradě)",
        "Kompaktní záběr 38–42 cm pro menší zahrady do 500 m²",
    ],
    "mower_chassis_material": [
        "Robustní ocelové šasi s antikorozním nátěrem (dlouhá životnost)",
        "Tvrzené hliníkové šasi (nepodléhá korozi a tlumí vibrace motoru)",
        "Lehké polypropylenové plastové šasi (snadné zvedání a manipulace)",
    ],
    "mower_cutting_system": [
        "Systém 4v1: sběr do koše, mulčování, zadní i boční výhoz trávy",
        "Kvalitní sběr do velkého textilního koše s indikátorem naplnění",
        "Čistě mulčovací sekačka bez nutnosti vysypávat koš",
    ],
    "mower_wheel_bearings": [
        "Kuličková ložiska ve všech kolech (lehký pojezd a dlouhá životnost bez viklání)",
        "Kluzná ložiska s mosaznými pouzdry",
        "Jednoduché plastové uložení kol",
    ],
    "mower_acoustic_comfort": [
        "Tichý akumulátorový motor (možnost sečení v neděli a za přítomnosti sousedů)",
        "Tichý benzínový motor s velkým tlumičem výfuku",
        "Standardní úroveň hluku benzínového motoru",
    ],
    "mower_electric_start": [
        "Elektrický startér tlačítkem na madle s Li-Ion baterií (snadný start bez tahání za šňůru)",
        "Klasický startér s automatickým sytičem ReadyStart",
        "Tradiční ruční tahací startér s pumpičkou paliva",
    ],

    # Generic Synthesizer Fallback Parameters
    "capacity_sizing": [
        "Velká kapacita pro rodinu či intenzivní zátěž (maximální prostorová i výkonová rezerva)",
        "Standardní střední velikost pro běžné každodenní použití",
        "Kompaktní úsporné provedení do menších prostor či pro občasné použití",
    ],
    "dimensions_installation": [
        "Kompaktní rozměry pro snadné umístění bez nutnosti stavebních úprav",
        "Standardní rozměry odpovídající běžným evropským normám",
        "Velkorysé rozměry s důrazem na maximální vnitřní objem",
    ],
    "controls_ui": [
        "Intuitivní fyzická mechanická tlačítka a otočné voliče (spolehlivost a ovládání poslepu)",
        "Moderní dotykový displej s přehlednou grafikou a českým menu",
        "Chytré ovládání přes mobilní aplikaci a Wi-Fi / Bluetooth",
    ],
    "energy_efficiency": [
        "Nejvyšší energetická třída A (minimální spotřeba elektřiny a vody)",
        "Vyvážená energetická třída B/C s výhodným poměrem ceny a provozních nákladů",
        "Základní energetická třída pro méně frekventované využití",
    ],
    "materials_durability": [
        "Prémiové kovové a nerezové komponenty s vysokou odolností proti opotřebení",
        "Kvalitní tvrzený plast a kompozitní slitiny",
        "Základní materiálové provedení s důrazem na dostupnou cenu",
    ],
    "maintenance_service": [
        "Snadná samoobslužná údržba a široce dostupné náhradní díly v ČR",
        "Autorizovaný servis s rychlou dostupností techniků po celé ČR",
        "Základní bezúdržbové provedení",
    ],
    "safety_certification": [
        "Špičková bezpečnostní certifikace s automatickým vypnutím a ochranou proti přetížení",
        "Standardní evropská certifikace CE a TÜV",
        "Základní bezpečnostní prvky dle platných norem",
    ],
    "total_budget": [
        "Ekonomická kategorie s nejlepším poměrem ceny a užitné hodnoty",
        "Zlatá střední třída s vyváženou kvalitou a dlouhou životností",
        "Prémiový segment bez kompromisů v materiálech a technologiích",
    ],
    "warranty_service": [
        "Prodloužená 5letá až 10letá záruka od výrobce s opravou přímo u zákazníka",
        "Standardní 3letá záruka s autorizovaným servisem v ČR",
        "Zákonná 2letá záruka",
    ],
    "noise_level_acoustic": [
        "Extra tichý chod (vhodné pro použití v noci a v otevřených obytných prostorech)",
        "Standardní akustická hladina běžná v dané kategorii",
        "Výkonový režim bez specifických požadavků na tichost",
    ],
}

# Apply ENRICHED_OPTIONS
updated_count = 0
for param_id, options in ENRICHED_OPTIONS.items():
    opts_str = "[\n          " + ",\n          ".join([f"'{opt}'" for opt in options]) + ",\n        ]"
    # Find parameter block by id
    pattern = rf"(id:\s*['\"]{param_id}['\"].*?suggestedValues:\s*\[)(.*?)(\])"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        text = text[:match.start(1)] + match.group(1).split("suggestedValues:")[0] + "suggestedValues: " + opts_str + text[match.end(3):]
        updated_count += 1

print(f"Enriched options for {updated_count} parameters!")

with open("src/lib/agent/domain-parameter-discovery.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Saved enriched domain-parameter-discovery.ts!")
