import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def api_call(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def run_checks():
    print("=== SCREEN-BY-SCREEN BACKEND HEALTH CHECK ===")
    
    # 1. Health check
    status, res = api_call("/health")
    assert status == 200, f"Health check failed: {res}"
    print("[PASS] Screen: Global Backend & Database Health (/health) -> 200 OK")
    
    # 2. Categories
    status, res = api_call("/categories")
    assert status == 200, f"Categories failed: {res}"
    categories = res.get("data", [])
    assert len(categories) >= 15, f"Expected 15 categories, got {len(categories)}"
    print(f"[PASS] Screen: Categories Page & Post Project (/categories) -> 200 OK ({len(categories)} categories loaded)")

    # 3. Find Professionals
    status, res = api_call("/professionals")
    assert status == 200, f"Find professionals failed: {res}"
    profs = res.get("data", [])
    assert len(profs) >= 1, "Expected at least 1 seeded professional"
    prof_id = profs[0]["id"]
    print(f"[PASS] Screen: Find Professionals Page (/professionals) -> 200 OK ({len(profs)} consultants found)")

    # 4. Professional Detail
    status, res = api_call(f"/professionals/{prof_id}")
    assert status == 200, f"Professional detail failed: {res}"
    prof_data = res.get("data", {})
    assert prof_data.get("display_name"), "Missing display name"
    print(f"[PASS] Screen: Professional Detail Page (/professionals/{prof_id}) -> 200 OK ('{prof_data['display_name']}')")

    # 5. Browse Projects
    status, res = api_call("/projects")
    assert status == 200, f"Browse projects failed: {res}"
    projs = res.get("data", [])
    assert len(projs) >= 1, "Expected at least 1 seeded project"
    proj_id = projs[0]["id"]
    print(f"[PASS] Screen: Browse Projects Page (/projects) -> 200 OK ({len(projs)} active projects)")

    # 6. Project Detail & Proposals
    status, res = api_call(f"/projects/{proj_id}")
    assert status == 200, f"Project detail failed: {res}"
    proj_data = res.get("data", {})
    print(f"[PASS] Screen: Project Detail Page (/projects/{proj_id}) -> 200 OK ('{proj_data['title']}')")

    # 7. Login as Priya (Customer)
    status, res = api_call("/auth/login", method="POST", data={
        "email": "priya.client@bitqube.org",
        "password": "BitQubeDemo2026!"
    })
    assert status == 200, f"Priya login failed: {res}"
    priya_token = res.get("data", {}).get("access_token")
    assert priya_token, "No access token returned for Priya"
    print("[PASS] Screen: Login Page (Customer Priya) -> 200 OK (JWT Access Token issued)")

    # 8. Login as Arjun (Professional)
    status, res = api_call("/auth/login", method="POST", data={
        "email": "arjun.consultant@bitqube.org",
        "password": "BitQubeDemo2026!"
    })
    assert status == 200, f"Arjun login failed: {res}"
    arjun_token = res.get("data", {}).get("access_token")
    assert arjun_token, "No access token returned for Arjun"
    print("[PASS] Screen: Login Page (Professional Arjun) -> 200 OK (JWT Access Token issued)")

    # 9. Professional Dashboard & My Proposals
    status, res = api_call("/proposals/me", token=arjun_token)
    assert status == 200, f"My proposals failed: {res}"
    arjun_proposals = res.get("data", [])
    print(f"[PASS] Screen: Professional Dashboard (/proposals/me) -> 200 OK ({len(arjun_proposals)} proposals)")

    # 10. Customer Contracts
    status, res = api_call("/contracts", token=priya_token)
    assert status == 200, f"Contracts failed: {res}"
    contracts = res.get("data", [])
    print(f"[PASS] Screen: Contracts List Page (/contracts) -> 200 OK ({len(contracts)} contracts for Priya)")

    print("\nALL BACKEND API ROUTES SUPPORTING FRONTEND SCREENS ARE FULLY HEALTHY!")

if __name__ == "__main__":
    run_checks()
