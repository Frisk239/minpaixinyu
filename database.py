import sqlite3
import os
import sys
from flask import g

# 获取数据库绝对路径
def get_database_path():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

DATABASE = get_database_path()

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

def init_app(app):
    app.teardown_appcontext(close_db)
    # 初始化数据库表结构
    with app.app_context():
        db = get_db()
        try:
            # 创建用户表
            db.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    avatar_blob BLOB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 创建问题表
            db.execute("""
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_text TEXT NOT NULL,
                    option_a TEXT NOT NULL,
                    option_b TEXT NOT NULL,
                    option_c TEXT NOT NULL,
                    option_d TEXT NOT NULL,
                    correct_answer TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 创建答题记录表
            db.execute("""
                CREATE TABLE IF NOT EXISTS answer_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    question_id INTEGER NOT NULL,
                    user_answer TEXT NOT NULL,
                    is_correct INTEGER NOT NULL,
                    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (question_id) REFERENCES questions (id)
                )
            """)
            
            # 创建地区探索记录表
            db.execute("""
                CREATE TABLE IF NOT EXISTS city_explorations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    city_name TEXT NOT NULL,
                    explored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    UNIQUE(user_id, city_name)
                )
            """)
            
            db.commit()
            
            # 初始化测试问题
            init_test_questions(db)
            
        except Exception as e:
            print(f"数据库初始化错误: {e}")
            raise

def init_test_questions(db):
    """初始化测试问题"""
    # 检查是否已有问题数据
    count = db.execute("SELECT COUNT(*) FROM questions").fetchone()[0]
    if count == 0:
        test_questions = [
            {
                'question_text': '福建省的省会是哪个城市？',
                'option_a': '厦门市',
                'option_b': '福州市',
                'option_c': '泉州市',
                'option_d': '漳州市',
                'correct_answer': 'B'
            },
            {
                'question_text': '福建土楼主要分布在哪两个地级市？',
                'option_a': '福州市和厦门市',
                'option_b': '泉州市和漳州市',
                'option_c': '龙岩市和漳州市',
                'option_d': '南平市和宁德市',
                'correct_answer': 'C'
            },
            {
                'question_text': '武夷山位于福建省的哪个地级市？',
                'option_a': '南平市',
                'option_b': '三明市',
                'option_c': '宁德市',
                'option_d': '龙岩市',
                'correct_answer': 'A'
            },
            {
                'question_text': '鼓浪屿属于福建省哪个城市？',
                'option_a': '泉州市',
                'option_b': '漳州市',
                'option_c': '厦门市',
                'option_d': '福州市',
                'correct_answer': 'C'
            },
            {
                'question_text': '福建省有多少个地级市？',
                'option_a': '8个',
                'option_b': '9个',
                'option_c': '10个',
                'option_d': '11个',
                'correct_answer': 'B'
            }
        ]
        
        for question in test_questions:
            db.execute("""
                INSERT INTO questions (question_text, option_a, option_b, option_c, option_d, correct_answer)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                question['question_text'],
                question['option_a'],
                question['option_b'],
                question['option_c'],
                question['option_d'],
                question['correct_answer']
            ))
        
        db.commit()
        print("已初始化测试问题数据")

def close_db(e=None):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()
