from flask import Flask, render_template, request, jsonify, redirect, url_for, session, g, send_file
import sqlite3
import os
from werkzeug.utils import secure_filename
import io

app = Flask(__name__)
app.secret_key = 'minpaixinyu-secret-key-2024'  # 生产环境应使用更安全的随机字符串

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# 初始化数据库
from database import get_db, init_app

init_app(app)

# 检查并添加必要的字段
with app.app_context():
    db = get_db()
    cursor = db.cursor()
    
    # 检查用户表是否存在avatar_blob字段
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    if 'avatar_blob' not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_blob BLOB")
        db.commit()
    
    # 检查是否存在地区探索记录表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='city_explorations'")
    if not cursor.fetchone():
        cursor.execute("""
            CREATE TABLE city_explorations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                city_name TEXT NOT NULL,
                explored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, city_name)
            )
        """)
        db.commit()

# ===== 用户认证相关路由 =====
@app.route('/upload-avatar', methods=['POST'])
def upload_avatar():
    if 'user_id' not in session:
        return jsonify({'error': '用户未登录'}), 401
    
    if 'avatar' not in request.files:
        return jsonify({'error': '未选择文件'}), 400
    
    file = request.files['avatar']
    if file.filename == '':
        return jsonify({'error': '未选择文件'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': '不支持的文件类型，仅允许png, jpg, jpeg, gif'}), 400
    
    avatar_blob = file.read()
    
    if len(avatar_blob) > 2 * 1024 * 1024:
        return jsonify({'error': '文件大小不能超过2MB'}), 400
    
    if len(avatar_blob) == 0:
        return jsonify({'error': '文件内容为空，请选择有效的图片文件'}), 400
    
    try:
        db = get_db()
        db.execute('UPDATE users SET avatar_blob = ? WHERE id = ?', (avatar_blob, session['user_id']))
        db.commit()
        return jsonify({'success': True})
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({'error': f'数据库错误: {str(e)}'}), 500

@app.route('/get-avatar')
def get_avatar():
    if 'user_id' not in session:
        return '', 401
    
    db = get_db()
    user = db.execute('SELECT avatar_blob FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user and user['avatar_blob']:
        return user['avatar_blob'], 200, {'Content-Type': 'image/jpeg'}
    
    # 返回默认头像
    default_avatar_path = os.path.join(app.root_path, 'static', 'images', 'default.png')
    try:
        with open(default_avatar_path, 'rb') as f:
            default_avatar = f.read()
        return default_avatar, 200, {'Content-Type': 'image/png'}
    except FileNotFoundError:
        # 如果没有默认头像文件，返回一个简单的SVG占位符头像
        svg_avatar = '''
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#8B7355"/>
            <circle cx="50" cy="40" r="15" fill="#D2B48C"/>
            <circle cx="40" cy="35" r="3" fill="white"/>
            <circle cx="60" cy="35" r="3" fill="white"/>
            <path d="M35,65 Q50,75 65,65" stroke="white" stroke-width="2" fill="none"/>
        </svg>
        '''.strip().encode('utf-8')
        return svg_avatar, 200, {'Content-Type': 'image/svg+xml'}

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        
        if user is None:
            return render_template('auth/login.html', error='用户不存在'), 401
        if user['password'] == password:
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('index'))
        return render_template('auth/login.html', error='密码错误'), 401
    return render_template('auth/login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        def calculate_username_length(username):
            length = 0
            for char in username:
                if '\u4e00' <= char <= '\u9fff':
                    length += 2
                else:
                    length += 1
            return length

        username = request.form['username']
        if calculate_username_length(username) > 20:
            return '用户名不能超过20个字符（中文字符算2个字符）', 400
        
        password = request.form['password']
        avatar = request.files.get('avatar')
        avatar_blob = None
        
        if avatar and avatar.filename:
            if not allowed_file(avatar.filename):
                return '不支持的文件类型，仅允许png, jpg, jpeg, gif', 400
            avatar_blob = avatar.read()
            if len(avatar_blob) > 2 * 1024 * 1024:
                return '文件大小不能超过2MB', 400
        
        db = get_db()
        try:
            db.execute(
                'INSERT INTO users (username, password, avatar_blob) VALUES (?, ?, ?)',
                (username, password, avatar_blob)
            )
            db.commit()
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            return 'Username already exists', 400
    return render_template('auth/register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/user-center')
def user_center():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    db = get_db()
    # 获取用户答题统计
    total_answers = db.execute('SELECT COUNT(*) FROM answer_records WHERE user_id = ?', (session['user_id'],)).fetchone()[0]
    correct_answers = db.execute('SELECT COUNT(*) FROM answer_records WHERE user_id = ? AND is_correct = 1', (session['user_id'],)).fetchone()[0]
    wrong_answers = total_answers - correct_answers
    correct_rate = round((correct_answers / total_answers) * 100) if total_answers > 0 else 0
    
    # 获取探索统计
    exploration_count = db.execute('SELECT COUNT(*) FROM city_explorations WHERE user_id = ?', (session['user_id'],)).fetchone()[0]
    
    return render_template('user_center.html',
                          total_answers=total_answers, 
                          correct_rate=correct_rate, 
                          wrong_answers=wrong_answers,
                          exploration_count=exploration_count)

# ===== 主要功能路由 =====
@app.route('/')
def index():
    # 福建地图首页
    return render_template('index.html')

@app.route('/ai-chat')
def ai_chat():
    # AI问答页面
    return render_template('ai_chat.html')

@app.route('/ebook')
def ebook():
    # 学习日志电子书页面
    return render_template('ebook.html')

@app.route('/quiz')
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    db = get_db()
    questions = db.execute('SELECT * FROM questions ORDER BY RANDOM() LIMIT 10').fetchall()
    return render_template('quiz.html', questions=questions)

# ===== 地市详情页路由 =====
@app.route('/city/<city_name>')
def city_detail(city_name):
    # 不再自动记录探索，让用户手动点击按钮来标记
    return render_template(f'cities/{city_name}.html', city_name=city_name)

# ===== API接口 =====
@app.route('/api/check-login')
def check_login():
    return jsonify({
        'logged_in': 'user_id' in session,
        'username': session.get('username', '')
    })

@app.route('/api/submit-answer', methods=['POST'])
def submit_answer():
    if 'user_id' not in session:
        return jsonify({'error': '未登录'}), 401
    
    data = request.get_json()
    db = get_db()
    
    question = db.execute(
        'SELECT * FROM questions WHERE id = ?', (data['question_id'],)
    ).fetchone()
    
    is_correct = data['user_answer'] == question['correct_answer']
    
    db.execute(
        'INSERT INTO answer_records (user_id, question_id, user_answer, is_correct) VALUES (?, ?, ?, ?)',
        (session['user_id'], data['question_id'], data['user_answer'], is_correct)
    )
    db.commit()
    
    return jsonify({
        'correct': is_correct,
        'correct_answer': question['correct_answer']
    })

@app.route('/api/chat', methods=['POST'])
def api_chat():
    if 'user_id' not in session:
        return jsonify({'error': '未登录，无法使用AI问答功能'}), 401

    data = request.get_json()
    question = data.get('question', '').strip()
    if not question:
        return jsonify({'error': '问题不能为空'}), 400

    try:
        # 读取AI配置
        with open('ai.json', 'r', encoding='utf-8') as f:
            import json
            ai_config = json.load(f)
        
        from openai import OpenAI
        client = OpenAI(
            api_key=ai_config['deepseek_api_key'],
            base_url="https://api.deepseek.com/v1"
        )

        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "你是一个福建文化知识问答助手，专门解答关于福建历史、文化、地理等相关问题。"},
                {"role": "user", "content": question}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        answer = response.choices[0].message.content
        return jsonify({'answer': answer})

    except FileNotFoundError:
        return jsonify({
            'error': '未找到AI配置文件，请联系管理员',
            'details': '请确保ai.json文件存在并包含有效的API密钥'
        }), 500
    except Exception as e:
        return jsonify({
            'error': '抱歉，无法获取回答',
            'details': f'API调用失败: {str(e)}'
        }), 500

@app.route('/api/get-questions')
def get_questions():
    if 'user_id' not in session:
        return jsonify({'error': '未登录'}), 401
    
    db = get_db()
    questions = db.execute('SELECT * FROM questions ORDER BY RANDOM() LIMIT 10').fetchall()
    
    # 将Row对象转换为字典
    questions_list = []
    for question in questions:
        questions_list.append({
            'id': question['id'],
            'question': question['question_text'],
            'option_a': question['option_a'],
            'option_b': question['option_b'],
            'option_c': question['option_c'],
            'option_d': question['option_d'],
            'correct_answer': question['correct_answer']
        })
    
    return jsonify({'questions': questions_list})

@app.route('/api/mark-explored', methods=['POST'])
def mark_explored():
    if 'user_id' not in session:
        return jsonify({'error': '未登录'}), 401
    
    # 支持JSON和表单两种数据格式
    if request.is_json:
        data = request.get_json()
        city_name = data.get('city_name')
    else:
        city_name = request.form.get('city_name')
    
    if not city_name:
        return jsonify({'error': '城市名称不能为空'}), 400
    
    db = get_db()
    try:
        db.execute(
            'INSERT OR IGNORE INTO city_explorations (user_id, city_name) VALUES (?, ?)',
            (session['user_id'], city_name)
        )
        db.commit()
        return jsonify({'success': True})
    except sqlite3.Error as e:
        db.rollback()
        return jsonify({'error': f'数据库错误: {str(e)}'}), 500

@app.route('/api/check-explored')
def check_explored():
    if 'user_id' not in session:
        return jsonify({'explored': False})
    
    city_name = request.args.get('city_name')
    if not city_name:
        return jsonify({'error': '城市名称不能为空'}), 400
    
    db = get_db()
    exploration = db.execute(
        'SELECT 1 FROM city_explorations WHERE user_id = ? AND city_name = ?',
        (session['user_id'], city_name)
    ).fetchone()
    
    return jsonify({'explored': exploration is not None})

@app.route('/api/get-explorations')
def get_explorations():
    if 'user_id' not in session:
        return jsonify({'explorations': []})
    
    db = get_db()
    explorations = db.execute(
        'SELECT city_name FROM city_explorations WHERE user_id = ?',
        (session['user_id'],)
    ).fetchall()
    
    return jsonify({
        'explorations': [exp['city_name'] for exp in explorations]
    })

# 提供PDF文件的路由
@app.route('/source/<path:filename>')
def serve_pdf(filename):
    # 确保只允许访问PDF文件
    if not filename.endswith('.pdf'):
        return '文件类型不允许', 403
    
    pdf_path = os.path.join(app.root_path, 'source', filename)
    
    if not os.path.exists(pdf_path):
        return '文件不存在', 404
    
    return send_file(pdf_path, as_attachment=False)

# 提供fujian.json文件的路由
@app.route('/fujian.json')
def serve_fujian_json():
    fujian_path = os.path.join(app.root_path, 'static', 'fujian.json')
    
    if not os.path.exists(fujian_path):
        return '文件不存在', 404
    
    return send_file(fujian_path, as_attachment=False, mimetype='application/json')

if __name__ == '__main__':
    app.run(debug=True)
