import sqlite3

def debug_session():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # 检查当前会话的用户ID
    cursor.execute('SELECT id, username FROM users WHERE username = "Frisk239"')
    user = cursor.fetchone()
    if user:
        print(f"用户信息: ID={user[0]}, 用户名={user[1]}")
        
        # 检查该用户的探索记录
        cursor.execute('SELECT * FROM city_explorations WHERE user_id = ?', (user[0],))
        explorations = cursor.fetchall()
        print(f"用户 {user[1]} 的探索记录:", explorations)
    else:
        print("用户 Frisk239 不存在")
    
    conn.close()

if __name__ == "__main__":
    debug_session()
