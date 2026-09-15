with open("src/lib/agent/domain-parameter-discovery.ts", "r", encoding="utf-8") as f:
    text = f.read()

old = "rationale: 'Mnoho moderních OLED displejů bliká na nízké frekvenci (PWM 240–480 Hz), což u citlivých uživatelů způsobuje pálení očí, únavu a migrény. Vysokofrekvenční PWM (nad 1920 Hz) chrání zrak. Otázka pro vás: Býváte citliví na bolesti očí při čtení z mobilu za šera?',"
new = "rationale: 'Mnoho moderních OLED displejů bliká na nízké frekvenci (PWM 240–480 Hz), což u citlivých uživatelů způsobuje pálení očí, únavu a migrény. Vysokofrekvenční PWM (nad 1920 Hz) chrání zrak. Telefony nad 220 g hmotnosti unavují malíček při dlouhém držení — důležité pro lidi s menšíma rukama. Otázka pro vás: Býváte citliví na bolesti očí nebo unavené ruce při čtení z mobilu za šera?',"

if old in text:
    text = text.replace(old, new)
    print("Replaced PWM rationale!")
else:
    print("Old text NOT found!")

with open("src/lib/agent/domain-parameter-discovery.ts", "w", encoding="utf-8") as f:
    f.write(text)
