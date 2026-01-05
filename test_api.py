import requests

BASE_URL = "https://api.keepcom.cn/api"

# 1. 登录获取 token
print("=== 登录测试 ===")
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "admin",
    "password": "admin123"  # 修改为你的密码
})
print(f"登录状态: {login_resp.status_code}")
print(f"登录响应: {login_resp.text[:500]}")

if login_resp.status_code == 201 or login_resp.status_code == 200:
    token = login_resp.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}

    # 2. 测试众筹列表
    print("\n=== 众筹列表测试 ===")
    cf_resp = requests.get(f"{BASE_URL}/crowdfundings", headers=headers)
    print(f"状态码: {cf_resp.status_code}")
    print(f"响应: {cf_resp.text[:1000]}")

    # 3. 测试产品列表
    print("\n=== 产品列表测试 ===")
    prod_resp = requests.get(f"{BASE_URL}/products", headers=headers)
    print(f"状态码: {prod_resp.status_code}")
    print(f"响应: {prod_resp.text[:1000]}")
else:
    print("登录失败，无法继续测试")
