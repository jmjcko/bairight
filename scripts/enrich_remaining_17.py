import re

with open("src/lib/agent/domain-parameter-discovery.ts", "r", encoding="utf-8") as f:
    text = f.read()

REMAINING_OPTIONS = {
    "tv_refresh_rate_gaming": [
        "Pravých 120 Hz / 144 Hz panel s HDMI 2.1 (plynulé sportovní přenosy a gaming na PS5/Xbox)",
        "Střední třída 100 Hz s dopočtem pohybu MEMC",
        "Základní 60 Hz panel (postačí pro běžné sledování TV vysílání)",
    ],
    "tv_audio_passthrough": [
        "Podpora Dolby Atmos / DTS:X a HDMI eARC (připojení kvalitního soundbaru nebo domácího kina)",
        "Kvalitní integrované reproduktory se subwooferem",
        "Základní stereo zvuk (postačí pro sledování zpráv a seriálů)",
    ],
    "washer_energy_efficiency": [
        "Plně automatické dávkování tekutého pracího gelu i-DOS / TwinDos (až na 20 praní)",
        "Zásobník na prací kapsle a manuální dávkování gelu",
        "Tradiční manuální zásuvka na prášek",
    ],
    "watch_gps_multiband": [
        "Dvoufrekvenční Multi-Band GPS L1+L5 (maximální přesnost v hustém lese, horách i mezi budovami)",
        "Standardní multi-GNSS systém (GPS, GLONASS, Galileo pro běh v parku)",
        "Základní GPS s optimalizací na co nejdelší výdrž baterie",
    ],
    "mattress_zones_support": [
        "7 anatomických zón s rozdílnou tuhostí (dokonalé uvolnění ramen a opora beder)",
        "3 až 5 anatomických zón pro vyváženou oporu páteře",
        "Jednozónová matrace s rovnoměrnou tuhostí po celé délce",
    ],
    "mattress_cover_hygiene": [
        "Snímatelný potah dělitelný na 2 poloviny pratelný na 60 °C (likvidace roztočů a snadné praní)",
        "Běžný zipový snímatelný potah pratelný na 40 °C",
        "Antibakteriální potah s vlákny stříbra nebo aloe vera",
    ],
    "mattress_cooling_gel": [
        "Chladivá gelová pěna GelFoam / termoaktivní potah (pro lidi náchylné k nočnímu pocení)",
        "Prodyšná latexová vrstva s perforací pro přirozené odvětrávání",
        "Standardní paměťová pěna s hřejivým efektem",
    ],
    "hp_scop_subzero": [
        "Špičkový topný faktor SCOP > 4.8 s garancí plného výkonu i při -20 °C",
        "Velmi dobrý SCOP 4.2–4.6 (optimální pro zateplené domy v podmínkách ČR)",
        "Standardní SCOP kolem 3.8–4.0 pro ekonomické řešení",
    ],
    "hp_refrigerant_propane": [
        "Přírodní ekologické chladivo R290 propan (výstupní voda až 75 °C – skvělé pro radiátory)",
        "Moderní syntetické chladivo R32 (vysoká účinnost pro podlahové topení)",
        "Osvědčené chladivo R410A s širokou servisní podporou",
    ],
    "hp_noise_level": [
        "Mimořádně tichá venkovní jednotka pod 35 dB(A) ve vzdálenosti 3 m (vhodné pro hustou zástavbu)",
        "Standardní hlučnost 38–42 dB(A) s nočním tichým režimem",
        "Běžná hlučnost bez omezení sousedskými vztahy",
    ],
    "hp_dhw_tank_volume": [
        "Integrovaný nerezový zásobník na 180–230 l vnitřní jednotky (úspora místa v domě)",
        "Samostatný externí bojler 250–300 l (pro velkou rodinu a časté napouštění vany)",
        "Pouze vytápění domu bez ohřevu TUV (ohřev vody řešen samostatně)",
    ],
    "hp_subsidy_compliance": [
        "Plná certifikace a splnění podmínek pro dotaci Nová zelená úsporám (kotlíková dotace)",
        "Instalace bez dotačního programu",
        "Kombinace s dotací na fotovoltaiku a zateplení",
    ],
    "skis_budget": [
        "Dostupná kategorie do 12 000 Kč včetně vázání (rekreační lyžování)",
        "Sportovní střední třída 12 000 – 22 000 Kč (univerzální all-mountain a sportovní carve)",
        "Prémiové a závodní modely nad 22 000 Kč (dřevěné jádro s dvojitým titanalem)",
    ],
    "budget": [
        "Dostupná cenová hladina s nejlepším poměrem ceny a výkonu",
        "Zlatá střední třída s vyšší odolností a pokročilejšími funkcemi",
        "Prémiová kategorie s nekompromisními materiály a maximální výbavou",
    ],
}

for param_id, options in REMAINING_OPTIONS.items():
    opts_str = "[\n          " + ",\n          ".join([f"'{opt}'" for opt in options]) + ",\n        ]"
    # replace all occurrences
    pattern = rf"(id:\s*['\"]{param_id}['\"].*?suggestedValues:\s*\[)(.*?)(\])"
    for match in re.finditer(pattern, text, re.DOTALL):
        text = text[:match.start(1)] + match.group(1).split("suggestedValues:")[0] + "suggestedValues: " + opts_str + text[match.end(3):]
        break

with open("src/lib/agent/domain-parameter-discovery.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Applied remaining 17 enrichments!")
