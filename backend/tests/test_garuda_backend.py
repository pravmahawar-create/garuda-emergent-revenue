"""GARUDA AI backend regression tests.

Covers: Auth, Dashboard, Opportunities, Tasks, Revenue, Activity,
Notifications, Settings — via the FastAPI shim public URL.
"""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://garuda-core.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@garuda.ai"
ADMIN_PASSWORD = "Garuda@2026"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    cookie_names = {c.name for c in s.cookies}
    assert "access_token" in cookie_names
    assert "refresh_token" in cookie_names
    return s


# ---------- Auth ----------
class TestAuth:
    def test_login_success_sets_cookies(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200
        data = r.json()
        # Response is the user object directly
        assert data.get("email") == ADMIN_EMAIL
        assert data.get("role") == "admin"
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names
        assert "refresh_token" in cookie_names

    def test_login_wrong_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "WrongPass!"}, timeout=30)
        assert r.status_code == 401
        body = r.json()
        assert "error" in body or "message" in body

    def test_me_without_cookie_401(self):
        r = requests.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_with_cookie(self, admin_session):
        r = admin_session.get(f"{API}/auth/me", timeout=30)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_register_new_and_duplicate(self):
        s = requests.Session()
        email = f"test_{uuid.uuid4().hex[:8]}@garuda.ai"
        payload = {"name": "Test Operator", "email": email, "password": "TestPass@123"}
        r1 = s.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r1.status_code == 201, r1.text
        assert r1.json().get("email") == email
        cookie_names = {c.name for c in s.cookies}
        assert "access_token" in cookie_names
        # duplicate
        r2 = requests.post(f"{API}/auth/register", json=payload, timeout=30)
        assert r2.status_code == 409


# ---------- Dashboard ----------
class TestDashboard:
    def test_summary(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/summary", timeout=30)
        assert r.status_code == 200
        data = r.json()
        kpis = data["kpis"]
        for k in ["totalRevenue", "mtdRevenue", "growthPct", "pipelineValue", "conversionRate", "openTasks", "overdueTasks"]:
            assert k in kpis, f"missing kpi {k}"
        stages = data["stageBreakdown"]
        # stageBreakdown is an object keyed by stage name with all 6 stages present
        assert isinstance(stages, dict) and len(stages) == 6
        for stage in ["prospect", "qualified", "proposal", "negotiation", "won", "lost"]:
            assert stage in stages
        assert isinstance(data["recentActivity"], list)

    def test_revenue_analytics(self, admin_session):
        r = admin_session.get(f"{API}/dashboard/revenue-analytics", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "monthlySeries" in data
        assert len(data["monthlySeries"]) == 6
        assert isinstance(data["bySource"], list)
        assert isinstance(data["topClients"], list)
        assert len(data["topClients"]) <= 5


# ---------- Opportunities ----------
class TestOpportunities:
    def test_list_has_seeded(self, admin_session):
        r = admin_session.get(f"{API}/opportunities", timeout=30)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 7

    def test_create_update_delete_flow(self, admin_session):
        # create
        payload = {
            "title": "TEST Opportunity",
            "client": "TEST Client",
            "potentialValue": 12345,
            "stage": "prospect",
            "source": "referral",
            "probability": 40,
            "notes": "auto test",
        }
        r = admin_session.post(f"{API}/opportunities", json=payload, timeout=30)
        assert r.status_code in (200, 201), r.text
        opp = r.json()
        opp_id = opp.get("_id") or opp.get("id")
        assert opp_id
        assert opp["title"] == "TEST Opportunity"

        # verify listed
        r2 = admin_session.get(f"{API}/opportunities", timeout=30)
        ids = [(o.get("_id") or o.get("id")) for o in r2.json()]
        assert opp_id in ids

        # patch stage -> activity log
        r3 = admin_session.patch(f"{API}/opportunities/{opp_id}", json={"stage": "qualified"}, timeout=30)
        assert r3.status_code == 200
        assert r3.json()["stage"] == "qualified"

        # verify activity of opportunity_stage_changed
        ract = admin_session.get(f"{API}/activity", timeout=30)
        assert ract.status_code == 200
        types = [a.get("type") for a in ract.json()[:30]]
        assert "opportunity_stage_changed" in types

        # delete
        r4 = admin_session.delete(f"{API}/opportunities/{opp_id}", timeout=30)
        assert r4.status_code in (200, 204)

        r5 = admin_session.get(f"{API}/opportunities/{opp_id}", timeout=30)
        assert r5.status_code == 404

        ract2 = admin_session.get(f"{API}/activity", timeout=30)
        types2 = [a.get("type") for a in ract2.json()[:30]]
        assert "opportunity_deleted" in types2


# ---------- Tasks ----------
class TestTasks:
    def test_list_seeded(self, admin_session):
        r = admin_session.get(f"{API}/tasks", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_task_crud_and_completion(self, admin_session):
        payload = {"title": "TEST task", "priority": "high", "status": "todo"}
        r = admin_session.post(f"{API}/tasks", json=payload, timeout=30)
        assert r.status_code in (200, 201)
        task = r.json()
        tid = task.get("_id") or task.get("id")
        assert tid

        r2 = admin_session.patch(f"{API}/tasks/{tid}", json={"status": "done"}, timeout=30)
        assert r2.status_code == 200
        upd = r2.json()
        assert upd["status"] == "done"
        assert upd.get("completedAt")

        ract = admin_session.get(f"{API}/activity", timeout=30)
        types = [a.get("type") for a in ract.json()[:30]]
        assert "task_completed" in types

        r3 = admin_session.delete(f"{API}/tasks/{tid}", timeout=30)
        assert r3.status_code in (200, 204)


# ---------- Revenue ----------
class TestRevenue:
    def test_list_seeded(self, admin_session):
        r = admin_session.get(f"{API}/revenue", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_revenue_create_updates_dashboard_total(self, admin_session):
        pre = admin_session.get(f"{API}/dashboard/summary", timeout=30).json()["kpis"]["totalRevenue"]
        payload = {
            "client": "TEST Rev Client",
            "amount": 5000,
            "source": "direct",
            "date": "2026-01-15",
        }
        r = admin_session.post(f"{API}/revenue", json=payload, timeout=30)
        assert r.status_code in (200, 201), r.text
        rev = r.json()
        rid = rev.get("_id") or rev.get("id")
        assert rid

        # dashboard total should include new record
        post = admin_session.get(f"{API}/dashboard/summary", timeout=30).json()["kpis"]["totalRevenue"]
        assert post >= pre + 5000 - 1  # allow rounding

        ract = admin_session.get(f"{API}/activity", timeout=30)
        types = [a.get("type") for a in ract.json()[:30]]
        assert "revenue_recorded" in types

        r2 = admin_session.delete(f"{API}/revenue/{rid}", timeout=30)
        assert r2.status_code in (200, 204)


# ---------- Activity ----------
class TestActivity:
    def test_reverse_chronological(self, admin_session):
        r = admin_session.get(f"{API}/activity", timeout=30)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        # timestamps descending
        ts = [a.get("createdAt") or a.get("timestamp") for a in arr if a.get("createdAt") or a.get("timestamp")]
        assert ts == sorted(ts, reverse=True)


# ---------- Notifications ----------
class TestNotifications:
    def test_list_and_mark(self, admin_session):
        r = admin_session.get(f"{API}/notifications", timeout=30)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)

        if arr:
            nid = arr[0].get("_id") or arr[0].get("id")
            r2 = admin_session.post(f"{API}/notifications/{nid}/read", timeout=30)
            assert r2.status_code in (200, 204)

        r3 = admin_session.post(f"{API}/notifications/read-all", timeout=30)
        assert r3.status_code in (200, 204)

        r4 = admin_session.get(f"{API}/notifications", timeout=30).json()
        unread = [n for n in r4 if n.get("read") is False or n.get("isRead") is False]
        assert len(unread) == 0


# ---------- Settings ----------
class TestSettings:
    def test_profile_update(self, admin_session):
        r = admin_session.patch(f"{API}/settings/profile", json={"name": "Garuda Operator"}, timeout=30)
        assert r.status_code == 200
        assert r.json()["name"] == "Garuda Operator"

    def test_change_password_wrong_current(self, admin_session):
        r = admin_session.post(
            f"{API}/settings/change-password",
            json={"currentPassword": "WrongOld!", "newPassword": "NewPass@123"},
            timeout=30,
        )
        assert r.status_code == 400

    def test_change_password_correct_flow(self):
        # separate session; change and revert
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200

        new_pw = "TempPwd@2026"
        r1 = s.post(
            f"{API}/settings/change-password",
            json={"currentPassword": ADMIN_PASSWORD, "newPassword": new_pw},
            timeout=30,
        )
        assert r1.status_code in (200, 204), r1.text

        # new pw login works
        s2 = requests.Session()
        r2 = s2.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": new_pw}, timeout=30)
        assert r2.status_code == 200

        # revert
        r3 = s2.post(
            f"{API}/settings/change-password",
            json={"currentPassword": new_pw, "newPassword": ADMIN_PASSWORD},
            timeout=30,
        )
        assert r3.status_code in (200, 204)
