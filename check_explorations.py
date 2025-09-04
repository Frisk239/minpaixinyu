import sqlite3

def check_explorations():
    try:
        # 使用正确的数据库文件
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        # 检查所有探索记录
        cursor.execute('SELECT * FROM city_explorations')
        results = cursor.fetchall()
        print('探索记录总数:', len(results))
        
        for row in results:
            print(f"ID: {row[0]}, 用户ID: {row[1]}, 城市名称: {row[2]}, 探索时间: {row[3]}")
            
        # 检查用户表
        print("\n用户表中的用户:")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if cursor.fetchone():
            cursor.execute("SELECT id, username FROM users LIMIT 5")
            users = cursor.fetchall()
            for user in users:
                print(f"用户ID: {user[0]}, 用户名: {user[1]}")
                
    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_explorations()
