import psycopg2
url = "postgresql://newcredential:smtFWMjS4IOCzl5sN6S0cYQkcInzJyAn@dpg-d86h8dvavr4c73e3haqg-a.singapore-postgres.render.com/inventory_c55j"
conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute("SELECT username, email FROM users")
for row in cur.fetchall():
    print(row)
conn.close()
