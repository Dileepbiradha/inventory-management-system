import sqlite3, glob
db = glob.glob('**/*.db', recursive=True)[0]
print('DB:', db)
c = sqlite3.connect(db)
c.execute("UPDATE users SET is_verified=1 WHERE email='test@test.com'")
c.commit()
print('rows changed:', c.total_changes)
