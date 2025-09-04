import requests

# 测试API端点
print("测试登录状态API...")
response = requests.get('http://localhost:5000/api/check-login')
login_data = response.json()
print("登录状态:", login_data)

if login_data['logged_in']:
    print("用户已登录，用户名:", login_data['username'])
    
    print("\n测试探索数据API...")
    response = requests.get('http://localhost:5000/api/get-explorations')
    explorations = response.json()
    print("探索数据:", explorations)
else:
    print("用户未登录")
