import psycopg2
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
new_password = "Admin@123"
hashed = pwd_context.hash(new_password)

url = "postgresql://newcredential:smtFWMjS4IOCzl5sN6S0cYQkcInzJyAn@dpg-d86h8dvavr4c73e3haqg-a.singapore-postgres.render.com/inventory_c55j"
conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute("UPDATE users SET hashed_password=%s WHERE username='dileepb'", (hashed,))
print(f"Password reset: {cur.rowcount} row(s)")
print(f"New password: {new_password}")
conn.commit()
cur.close()
conn.close()
