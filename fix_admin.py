import psycopg2

# 🔧 PASTE the External Database URL from Render here:
DATABASE_URL = "postgresql://newcredential:smtFWMjS4IOCzl5sN6S0cYQkcInzJyAn@dpg-d86h8dvavr4c73e3haqg-a.singapore-postgres.render.com/inventory_c55j"

# 🔧 REPLACE with the email you use to log into the app:
YOUR_EMAIL = "dileep.biradha@gmail.com"

print("Connecting to database...")
# Add SSL mode required by Render
conn = psycopg2.connect(DATABASE_URL, sslmode='require')
cur = conn.cursor()

# Show all users first
print("\n=== ALL USERS BEFORE ===")
cur.execute("SELECT id, email, role FROM users;")
rows = cur.fetchall()
for row in rows:
    print(f"  ID={row[0]}, email={row[1]}, role={row[2]}")

if not rows:
    print("  ⚠️ No users found!")

# Update role to admin
print(f"\n--- Updating {YOUR_EMAIL} to admin ---")
cur.execute("UPDATE users SET role = 'admin' WHERE email = %s;", (YOUR_EMAIL,))
print(f"✅ Updated {cur.rowcount} row(s)")
conn.commit()

# Verify
print("\n=== VERIFY ===")
cur.execute("SELECT id, email, role FROM users WHERE email = %s;", (YOUR_EMAIL,))
result = cur.fetchone()
if result:
    print(f"  ID={result[0]}, email={result[1]}, role={result[2]}")
else:
    print("  ⚠️ User not found! Check your email.")

cur.close()
conn.close()
print("\n✅ Done!")