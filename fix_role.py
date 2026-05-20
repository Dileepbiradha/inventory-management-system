import psycopg2

# 🔴 PASTE YOUR EXTERNAL DATABASE URL HERE (from Render → inventory-db → Connections)
DATABASE_URL = "postgresql://newcredential:smtFWMjS4IOCzl5sN6S0cYQkcInzJyAn@dpg-d86h8dvavr4c73e3haqg-a.singapore-postgres.render.com/inventory_c55j"

# 🔴 PUT YOUR LOGIN EMAIL HERE
YOUR_EMAIL = "dileep.biradha@gmail.com"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

print("=== ALL USERS BEFORE ===")
cur.execute("SELECT id, email, role FROM users;")
for row in cur.fetchall():
    print(row)

cur.execute("UPDATE users SET role = 'admin' WHERE email = %s;", (YOUR_EMAIL,))
conn.commit()

print(f"\nUpdated {YOUR_EMAIL} to admin")

cur.execute("SELECT id, email, role FROM users WHERE email = %s;", (YOUR_EMAIL,))
print("AFTER UPDATE:", cur.fetchone())

cur.close()
conn.close()