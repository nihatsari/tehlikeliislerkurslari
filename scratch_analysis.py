import sqlite3

db_path = r'C:\Users\nyt\AppData\Local\Google\Google-AdWords-Editor\759\ape_8941796297.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check Account table or similar
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%account%'")
print("Account tables:", cur.fetchall())

for t in ['Account', 'Customer', 'User']:
    try:
        cur.execute(f"SELECT * FROM {t}")
        print(f"Table {t}:", cur.fetchall())
    except Exception as e:
        pass
