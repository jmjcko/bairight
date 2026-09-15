with open("src/lib/agent/domain-parameter-discovery.ts", "r", encoding="utf-8") as f:
    text = f.read()

text = text.replace(
    "suggestedValues: ['4 000 – 45 000 Kč']",
    """suggestedValues: [
          'Základní domácí kávovar (do 8 000 Kč)',
          'Kvalitní automatický kávovar s mlékem (8 000 – 20 000 Kč)',
          'Prémiový pákový nebo luxusní automatický stroj (nad 20 000 Kč)',
        ]"""
)

text = text.replace(
    "suggestedValues: ['5 000 – 35 000 Kč']",
    """suggestedValues: [
          'Základní ergonomická židle (do 8 000 Kč)',
          'Kvalitní synchronní židle se síťovinou (8 000 – 18 000 Kč)',
          'Prémiová zdravotní židle (Herman Miller / SpinaliS – nad 18 000 Kč)',
        ]"""
)

text = text.replace(
    "suggestedValues: ['15 000 – 85 000 Kč']",
    """suggestedValues: [
          'Cenově dostupný studentský notebook (do 18 000 Kč)',
          'Všestranná střední třída pro práci i zábavu (18 000 – 35 000 Kč)',
          'Prémiový ultrabook nebo grafická stanice (nad 35 000 Kč)',
        ]"""
)

with open("src/lib/agent/domain-parameter-discovery.ts", "w", encoding="utf-8") as f:
    f.write(text)

print("Replaced specific budget ranges!")
