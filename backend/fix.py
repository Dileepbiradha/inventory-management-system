import psycopg2
url = "postgresql://newcredential:smtFWMjS4IOCzl5sN6S0cYQkcInzJyAn@dpg-d86h8dvavr4c73e3haqg-a.singapore-postgres.render.com/inventory_c55j"
conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute("UPDATE users SET is_verified=true, is_admin=true, is_active=true, role='admin' WHERE username='testadmin'")
print(f"Updated: {cur.rowcount}")
cur.execute("SELECT username, is_verified, is_admin, is_active FROM users")
print(cur.fetchall())
conn.commit()