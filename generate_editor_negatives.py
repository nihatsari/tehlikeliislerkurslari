import csv

campaigns = [
    "kurs.tc - 01 Insaat ve Yapi Isleri",
    "kurs.tc - 02 Metal ve Imalat Sanayi",
    "kurs.tc - 03 Vinc ve Is Makineleri",
    "kurs.tc - 04 Elektrik ve Otomasyon"
]

negatives = [
    "öğrenme",
    "öğrenmek",
    "\"öğrenme kursu\"",
    "\"nasıl öğrenilir\"",
    "\"kaç yıl geçerli\"",
    "\"geçerlilik süresi\"",
    "\"kaç metre\"",
    "\"yazılı sınav\"",
    "\"sınav soruları\"",
    "\"çıkmış sorular\"",
    "\"e devletten nasıl\"",
    "\"e devlette görünür mü\"",
    "\"global kaynak okulu\"",
    "komek",
    "ismek",
    "busmek",
    "ücretsiz",
    "bedava"
]

lines = ["Kampanya\tAnahtar kelime"]
for c in campaigns:
    for neg in negatives:
        lines.append(f"{c}\t{neg}")

with open("editor_icin_negatifler.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"Total rows generated: {len(lines)}")
print("Sample:")
print("\n".join(lines[:8]))
