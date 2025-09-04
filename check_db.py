import sqlite3

def check_explorations():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()
    
    # 检查探索记录
    cursor.execute('SELECT * FROM city_explorations')
    explorations = cursor.fetchall()
    print("探索记录:", explorations)
    
    # 检查用户表
    cursor.execute('SELECT id, username FROM users')
    users = cursor.fetchall()
    print("用户列表:", users)
    
    conn.close()

if __name__ == "__main__":
    check_explorations()
