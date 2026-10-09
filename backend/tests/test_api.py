import threading
from datetime import date, timedelta

import pytest

from .conftest import login

TODAY = date.today()


def d(n):
    return (TODAY + timedelta(days=n)).isoformat()


# ───────── basics / search
def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_listing_page_and_pagination(client):
    r = client.get("/api/listings", params={"pageSize": 12}).json()
    assert r["total"] >= 88 and len(r["items"]) == 12 and r["hasMore"] is True
    first = r["items"][0]
    for key in ("id", "title", "price", "rating", "reviewCount", "images", "maxGuests", "guestFavourite"):
        assert key in first
    p2 = client.get("/api/listings", params={"pageSize": 12, "page": 2}).json()
    assert {i["id"] for i in r["items"]}.isdisjoint({i["id"] for i in p2["items"]})


def test_search_where_aliases_and_filters(client):
    manali = client.get("/api/listings", params={"where": "Manali", "pageSize": 48}).json()
    assert manali["total"] >= 7 and all("manali" in (i["city"] + i["area"] + i["title"]).lower() or i["state"] for i in manali["items"])
    assert client.get("/api/listings/count", params={"where": "Gurgaon District"}).json()["total"] >= 7  # alias -> Gurugram
    assert client.get("/api/listings/count", params={"where": "zzzz-nowhere"}).json()["total"] == 0
    cheap = client.get("/api/listings", params={"maxPrice": 1500, "pageSize": 48}).json()
    assert cheap["total"] > 0 and all(i["price"] <= 1500 for i in cheap["items"])
    rooms = client.get("/api/listings", params={"place": "room", "pageSize": 48}).json()
    assert rooms["total"] > 0 and all(i["place"] == "room" for i in rooms["items"])
    pool = client.get("/api/listings", params={"amenities": "wifi,pool", "pageSize": 48}).json()
    assert all({"wifi", "pool"} <= set(i["amenities"]) for i in pool["items"])
    big = client.get("/api/listings", params={"adults": 6, "pageSize": 48}).json()
    assert all(i["maxGuests"] >= 6 for i in big["items"])
    low = client.get("/api/listings", params={"sort": "low", "pageSize": 48}).json()["items"]
    assert [i["price"] for i in low] == sorted(i["price"] for i in low)
    assert client.get("/api/listings", params={"category": "beach"}).json()["total"] > 0


def test_search_excludes_unavailable_listings(client):
    detail = client.get("/api/listings/meleto-woods").json()
    a, b = detail["unavailable"][0]
    ids = {i["id"] for i in client.get("/api/listings", params={"where": "Manali", "checkIn": a, "checkOut": b, "pageSize": 48}).json()["items"]}
    assert "meleto-woods" not in ids
    ids = {i["id"] for i in client.get("/api/listings", params={"where": "Manali", "pageSize": 48}).json()["items"]}
    assert "meleto-woods" in ids


def test_collections_and_meta(client):
    c = client.get("/api/listings/collections", params={"cities": "Manali,Shimla", "limit": 7}).json()
    assert len(c["Manali"]) == 7 and len(c["Shimla"]) == 7
    assert len(client.get("/api/meta/amenities").json()) >= 20
    assert len(client.get("/api/meta/categories").json()) == 11
    assert any(p["city"] == "Manali" for p in client.get("/api/meta/places", params={"q": "man"}).json())
    assert len(client.get("/api/listings/map", params={"where": "Shimla"}).json()) >= 7


def test_detail_reviews_nearby(client):
    det = client.get("/api/listings/meleto-woods").json()
    assert det["host"]["name"] == "Kamal" and det["rating"] == 4.94 and det["reviewCount"] == 34
    assert len(det["images"]) == 5 and len(det["ratingBreakdown"]) == 5 and sum(det["ratingHistogram"]) == 34
    assert "address" not in det  # private fields never leak to guests
    rv = client.get("/api/listings/meleto-woods/reviews", params={"pageSize": 6}).json()
    assert rv["total"] == 34 and len(rv["items"]) == 6 and rv["hasMore"]
    view = client.get("/api/listings/meleto-woods/reviews", params={"topic": "View"}).json()
    assert 0 < view["total"] < 34
    assert all(i["id"] != "meleto-woods" for i in client.get("/api/listings/meleto-woods/nearby").json())
    assert client.get("/api/listings/does-not-exist").status_code == 404


# ───────── auth
def test_signup_login_me(client):
    body = {"firstName": "Test", "lastName": "User", "email": "Test.User@Example.com", "password": "supersecret1", "dob": "1999-05-01"}
    assert client.post("/api/auth/check", json={"email": "test.user@example.com"}).json() == {"exists": False}
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code == 201 and r.json()["user"]["email"] == "test.user@example.com"
    assert client.post("/api/auth/signup", json=body).status_code == 409
    assert client.post("/api/auth/check", json={"email": "test.user@example.com"}).json() == {"exists": True}
    assert client.post("/api/auth/login", json={"email": "test.user@example.com", "password": "wrong"}).status_code == 401
    h = login(client, "test.user@example.com", "supersecret1")
    me = client.get("/api/auth/me", headers=h).json()
    assert me["firstName"] == "Test" and me["isHost"] is False
    upd = client.patch("/api/auth/me", headers=h, json={"profile": {"school": "TIET", "interests": ["Travel"], "intro": "Hi"}}).json()
    assert upd["profile"]["school"] == "TIET" and upd["profile"]["interests"] == ["Travel"]
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer junk"}).status_code == 401


def test_signup_validation(client):
    base = {"firstName": "A", "lastName": "B", "email": "a@b.co", "password": "longenough1"}
    assert client.post("/api/auth/signup", json={**base, "password": "short"}).status_code == 422
    assert client.post("/api/auth/signup", json={**base, "email": "nope"}).status_code == 422
    minor = (TODAY.replace(year=TODAY.year - 10)).isoformat()
    assert client.post("/api/auth/signup", json={**base, "email": "kid@b.co", "dob": minor}).status_code == 422


def test_demo_login(client):
    r = client.post("/api/auth/demo", json={"provider": "Google"})
    assert r.status_code == 200 and r.json()["user"]["email"] == "demo.google@example.com"


# ───────── booking flow
def book(client, h, listing="manali-1", ci=100, co=103, **kw):
    return client.post("/api/bookings", headers=h, json={"listingId": listing, "checkIn": d(ci), "checkOut": d(co), "adults": 2, **kw})


def test_quote_matches_booking_total(client, guest):
    q = client.get("/api/listings/manali-3/quote", params={"checkIn": d(120), "checkOut": d(123), "adults": 2}).json()
    assert q["available"] and q["nights"] == 3 and 3 * 2190 <= q["subtotal"] <= 3 * 2190 * 1.5 and q["total"] == q["subtotal"] + q["cleaningFee"] + q["serviceFee"] - (q["discount"]["amount"] if q["discount"] else 0)
    r = book(client, guest, "manali-3", 120, 123)
    assert r.status_code == 201, r.text
    b = r.json()
    assert b["total"] == q["total"] and b["nights"] == 3 and len(b["code"]) == 6 and b["listing"]["id"] == "manali-3"


def test_weekly_discount_applies(client):
    q = client.get("/api/listings/manali-4/quote", params={"checkIn": d(200), "checkOut": d(208), "adults": 1}).json()
    assert q["discount"]["type"] == "weekly" and q["discount"]["pct"] == 10 and q["discount"]["amount"] == round(q["subtotal"] * 0.1)


def test_booking_blocks_dates_and_cancel_releases(client, guest):
    r = book(client, guest, "shimla-2", 150, 153)
    assert r.status_code == 201
    bid = r.json()["id"]
    unavailable = client.get("/api/listings/shimla-2").json()["unavailable"]
    assert any(a <= d(150) and b >= d(153) for a, b in unavailable)
    again = book(client, guest, "shimla-2", 151, 154)           # overlapping
    assert again.status_code == 409
    adjacent = book(client, guest, "shimla-2", 153, 155)        # checkout day == next check-in is fine
    assert adjacent.status_code == 201
    q = client.get("/api/listings/shimla-2/quote", params={"checkIn": d(150), "checkOut": d(152), "adults": 1}).json()
    assert q["available"] is False
    ids = {i["id"] for i in client.get("/api/listings", params={"where": "Shimla", "checkIn": d(150), "checkOut": d(153), "pageSize": 48}).json()["items"]}
    assert "shimla-2" not in ids
    assert client.post(f"/api/bookings/{bid}/cancel", headers=guest).json()["status"] == "cancelled"
    assert book(client, guest, "shimla-2", 150, 153).status_code == 201   # dates are free again
    mine = client.get("/api/bookings/mine", headers=guest).json()
    assert any(m["id"] == bid and m["status"] == "cancelled" for m in mine)


def test_booking_validation(client, guest):
    assert client.post("/api/bookings", json={"listingId": "manali-1", "checkIn": d(5), "checkOut": d(7)}).status_code == 401
    assert book(client, guest, "manali-1", -3, 2).status_code == 422                       # past
    assert book(client, guest, "manali-1", 30, 30).status_code == 422                      # zero nights
    assert book(client, guest, "manali-1", 30, 28).status_code == 422                      # checkout before check-in
    assert book(client, guest, "manali-1", 300, 302, adults=10).status_code == 422         # over capacity
    assert book(client, guest, "nope", 300, 302).status_code == 404
    assert book(client, guest, "manali-1", 300, 302, adults=0).status_code == 422          # no guests
    r = book(client, guest, "manali-1", 300, 302, adults=2, pets=1)                         # pets not allowed (unless amenity)
    assert r.status_code in (201, 422)


def test_cannot_book_own_listing(client, host):
    r = book(client, host, "meleto-woods", 250, 252)
    assert r.status_code == 422 and "own listing" in r.json()["detail"]


def test_concurrent_bookings_only_one_wins(client):
    tokens = []
    for i in range(1, 7):
        tokens.append(login(client, f"{['aarav.mehta','simran.kaur','karthik.reddy','anushka.gupta','chandramani.jha','seema.joshi'][i-1]}@guest.demo"))
    results = []

    def go(h):
        results.append(book(client, h, "north-goa-1", 400, 403, adults=1).status_code)

    ts = [threading.Thread(target=go, args=(h,)) for h in tokens]
    [t.start() for t in ts]
    [t.join() for t in ts]
    assert sorted(results).count(201) == 1 and sorted(results).count(409) == 5, results


def test_pending_booking_needs_host_approval(client, guest):
    # find a non-instant listing owned by a seeded host
    items = client.get("/api/listings", params={"pageSize": 48}).json()["items"]
    target = next(i for i in items if not i["instantBook"] and i["ownerId"] == "user_priya")
    r = book(client, guest, target["id"], 500, 502, message="Arriving late, around 10pm.")
    assert r.status_code == 201 and r.json()["status"] == "pending"
    bid = r.json()["id"]
    h = login(client, "priya@host.demo")
    mine = client.get("/api/host/bookings", headers=h).json()
    assert any(b["id"] == bid for b in mine)
    assert client.patch(f"/api/host/bookings/{bid}", headers=guest, json={"status": "confirmed"}).status_code == 404   # not the host
    ok = client.patch(f"/api/host/bookings/{bid}", headers=h, json={"status": "confirmed"})
    assert ok.status_code == 200 and ok.json()["status"] == "confirmed"
    assert client.patch(f"/api/host/bookings/{bid}", headers=h, json={"status": "declined"}).status_code == 409
    convs = client.get("/api/host/conversations", headers=h).json()
    c = next(c for c in convs if any("10pm" in m["text"] for m in c["messages"]))
    sent = client.post(f"/api/conversations/{c['id']}/messages", headers=h, json={"text": "No problem!"})
    assert sent.status_code == 201 and sent.json()["messages"][-1]["from"] == "host"
    assert client.post(f"/api/conversations/{c['id']}/messages", headers=login(client, "rohan@host.demo"), json={"text": "x"}).status_code == 404


def test_decline_releases_dates(client, guest):
    items = client.get("/api/listings", params={"pageSize": 48}).json()["items"]
    target = next(i for i in items if not i["instantBook"] and i["ownerId"] == "user_anjali")
    bid = book(client, guest, target["id"], 600, 602).json()["id"]
    h = login(client, "anjali@host.demo")
    assert client.patch(f"/api/host/bookings/{bid}", headers=h, json={"status": "declined"}).json()["status"] == "declined"
    assert client.get(f"/api/listings/{target['id']}/quote", params={"checkIn": d(600), "checkOut": d(602), "adults": 1}).json()["available"]


# ───────── reviews
def test_review_after_stay(client, guest):
    mine = client.get("/api/bookings/mine", headers=guest).json()
    past = next(b for b in mine if b["listingId"] == "manali-1" and b["canReview"])
    upcoming = next(b for b in mine if b["checkIn"] > d(0) and b["status"] == "confirmed")
    before = client.get("/api/listings/manali-1").json()
    assert client.post(f"/api/bookings/{upcoming['id']}/review", headers=guest, json={"stars": 5, "text": "too early"}).status_code == 422
    r = client.post(f"/api/bookings/{past['id']}/review", headers=guest, json={"stars": 3, "text": "Decent stay, a bit noisy."})
    assert r.status_code == 201 and r.json()["name"] == "Demo"
    after = client.get("/api/listings/manali-1").json()
    assert after["reviewCount"] == before["reviewCount"] + 1 and after["rating"] < before["rating"]
    assert client.post(f"/api/bookings/{past['id']}/review", headers=guest, json={"stars": 5, "text": "again"}).status_code == 409
    assert client.get("/api/bookings/mine", headers=guest).json()[0] is not None


# ───────── wishlist
def test_wishlist(client):
    h = login(client, "seema.joshi@guest.demo")
    assert client.get("/api/wishlist", headers=h).json()["ids"] == []
    w = client.put("/api/wishlist", headers=h, json={"itemType": "listing", "itemId": "manali-1"}).json()
    client.put("/api/wishlist", headers=h, json={"itemType": "listing", "itemId": "manali-1"})  # idempotent
    client.put("/api/wishlist", headers=h, json={"itemType": "experience", "itemId": "exp-2"})
    w = client.get("/api/wishlist", headers=h).json()
    assert sorted(w["ids"]) == ["exp-2", "manali-1"] and len(w["listings"]) == 1 and len(w["activities"]) == 1
    assert client.put("/api/wishlist", headers=h, json={"itemType": "listing", "itemId": "ghost"}).status_code == 404
    w = client.delete("/api/wishlist/listing/manali-1", headers=h).json()
    assert w["ids"] == ["exp-2"]
    assert client.get("/api/wishlist").status_code == 401


# ───────── experiences & services
def test_activities(client, guest):
    ex = client.get("/api/activities", params={"kind": "experience"}).json()
    sv = client.get("/api/activities", params={"kind": "service"}).json()
    assert ex["total"] == 35 and sv["total"] == 14
    ph = client.get("/api/activities", params={"kind": "service", "type": "Photography"}).json()
    assert ph["total"] > 0 and all(a["category"] == "Photography" for a in ph["items"])
    assert client.get("/api/activities", params={"kind": "experience", "where": "Chandigarh"}).json()["total"] > 0
    first = next(a for a in ex["items"] if not a["comingSoon"])
    r = client.post("/api/activity-bookings", headers=guest, json={"activityId": first["id"], "day": d(10), "guests": 2})
    assert r.status_code == 201 and r.json()["total"] >= first["price"]
    soon = next(a for a in ex["items"] if a["comingSoon"])
    assert client.post("/api/activity-bookings", headers=guest, json={"activityId": soon["id"], "day": d(10), "guests": 1}).status_code == 422
    assert client.post("/api/activity-bookings", headers=guest, json={"activityId": first["id"], "day": d(-1), "guests": 1}).status_code == 422
    assert any(b["activity"]["id"] == first["id"] for b in client.get("/api/activity-bookings/mine", headers=guest).json())


# ───────── host CRUD + wizard draft
PHOTOS = [f"https://example.com/p{i}.jpg" for i in range(5)]
DRAFT = {"kind": "House", "place": "entire", "address": "Leela Bhawan, Patiala, Punjab 147001, India", "city": "Patiala", "state": "Punjab",
         "area": "Leela Bhawan", "pin": "147001", "precise": False, "guests": 4, "bedrooms": 2, "beds": 2, "baths": 1,
         "amenities": ["wifi", "ac", "pool"], "photos": PHOTOS, "title": "Heritage haveli stay", "highlights": ["Peaceful"],
         "description": "A calm home near the old city.", "instantBook": True, "price": 3200, "weekend": 5,
         "discounts": ["weekly", "monthly"], "safety": [], "business": False, "street": "12 Leela Bhawan Road", "flat": "", "landmark": "", "locality": ""}


@pytest.fixture()
def new_host(client):
    import uuid
    email = f"host{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/auth/signup", json={"firstName": "Hosty", "lastName": "McHost", "email": email, "password": "password123"})
    return login(client, email, "password123")


def test_host_wizard_publish_and_crud(client, new_host, guest):
    assert client.get("/api/host/draft", headers=new_host).json() is None
    r = client.put("/api/host/draft", headers=new_host, json={"step": 4, "data": {**DRAFT, "photos": PHOTOS[:2]}})
    assert r.status_code == 200 and r.json()["step"] == 4
    assert client.post("/api/host/draft/publish", headers=new_host).status_code == 422          # < 5 photos
    client.put("/api/host/draft", headers=new_host, json={"step": 19, "data": {**DRAFT, "business": None}})
    assert client.post("/api/host/draft/publish", headers=new_host).status_code == 422          # business not answered
    client.put("/api/host/draft", headers=new_host, json={"step": 19, "data": DRAFT})
    pub = client.post("/api/host/draft/publish", headers=new_host)
    assert pub.status_code == 201, pub.text
    lid = pub.json()["id"]
    assert pub.json()["kind"] == "Home" and pub.json()["address"] and pub.json()["weekend"] == 5
    assert client.get("/api/host/draft", headers=new_host).json() is None                       # draft consumed
    assert client.get("/api/auth/me", headers=new_host).json()["isHost"] is True
    # appears in guest search, address stays private
    found = client.get("/api/listings", params={"where": "Heritage", "pageSize": 5}).json()
    assert found["total"] == 1 and found["items"][0]["id"] == lid
    assert "address" not in client.get(f"/api/listings/{lid}").json()
    # guests book it (instant book) -> host sees reservation
    b = book(client, guest, lid, 40, 43, adults=2)
    assert b.status_code == 201 and b.json()["status"] == "confirmed"
    assert len(client.get("/api/host/bookings", headers=new_host).json()) == 1
    assert len(client.get(f"/api/host/listings/{lid}/bookings", headers=new_host).json()) == 1
    # edit via PUT and PATCH
    body = {"title": "Heritage haveli (renovated)", "kind": "Home", "place": "entire", "description": "Updated", "city": "Patiala", "state": "Punjab",
            "area": "Leela Bhawan", "price": 3500, "maxGuests": 4, "bedrooms": 2, "beds": 2, "baths": 1, "amenities": ["wifi"],
            "photos": PHOTOS, "instantBook": True, "discounts": ["weekly"]}
    assert client.put(f"/api/host/listings/{lid}", headers=new_host, json=body).json()["price"] == 3500
    assert client.patch(f"/api/host/listings/{lid}", headers=new_host, json={"price": 3600, "freeCancel": False}).json()["freeCancel"] is False
    assert client.patch(f"/api/host/listings/{lid}", headers=new_host, json={"price": 10}).status_code == 422
    # calendar: block / unblock a night, can't block a booked night
    assert client.put(f"/api/host/listings/{lid}/blocked-dates", headers=new_host, json={"day": d(80), "blocked": True}).json()["hostBlocked"] == [d(80)]
    assert any(a <= d(80) < b for a, b in client.get(f"/api/listings/{lid}").json()["unavailable"])
    assert client.put(f"/api/host/listings/{lid}/blocked-dates", headers=new_host, json={"day": d(41), "blocked": True}).status_code == 409
    assert book(client, guest, lid, 79, 82).status_code == 409
    assert client.put(f"/api/host/listings/{lid}/blocked-dates", headers=new_host, json={"day": d(80), "blocked": False}).json()["hostBlocked"] == []
    # other users can't touch it
    other = login(client, "kamal@host.demo")
    assert client.delete(f"/api/host/listings/{lid}", headers=other).status_code == 404
    assert client.put(f"/api/host/listings/{lid}", headers=other, json=body).status_code == 404
    assert client.get(f"/api/host/listings/{lid}", headers=guest).status_code == 404
    # unlist hides it, delete removes it and its bookings
    client.patch(f"/api/host/listings/{lid}", headers=new_host, json={"status": "unlisted"})
    assert client.get(f"/api/listings/{lid}").status_code == 404
    assert client.delete(f"/api/host/listings/{lid}", headers=new_host).status_code == 204
    assert client.get("/api/host/listings", headers=new_host).json() == []
    assert all(x["listingId"] != lid for x in client.get("/api/bookings/mine", headers=guest).json())


def test_edit_existing_listing_through_draft(client, host):
    mine = client.get("/api/host/listings", headers=host).json()
    l = next(x for x in mine if x["id"] == "meleto-woods")
    data = {**DRAFT, "photos": l["images"], "title": l["title"][:50], "description": l["description"][:500], "price": l["price"] + 100,
            "city": l["city"], "state": l["state"], "area": l["area"], "street": "Vashisht", "pin": "175131", "amenities": l["amenities"]}
    client.put("/api/host/draft", headers=host, json={"step": 19, "listingId": "meleto-woods", "data": data})
    r = client.post("/api/host/draft/publish", headers=host)
    assert r.status_code == 201 and r.json()["id"] == "meleto-woods" and r.json()["price"] == l["price"] + 100
    assert client.get("/api/listings/meleto-woods").json()["rating"] == 4.94    # reviews survive edits
    client.patch("/api/host/listings/meleto-woods", headers=host, json={"price": l["price"]})


def test_host_endpoints_require_login(client):
    for path in ("/api/host/listings", "/api/host/bookings", "/api/host/draft", "/api/host/conversations", "/api/bookings/mine"):
        assert client.get(path).status_code == 401


# ───────── uploads
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_upload(client, guest):
    ok = client.post("/api/uploads", headers=guest, files={"file": ("a.png", PNG, "image/png")})
    assert ok.status_code == 201 and ok.json()["url"].endswith(".png")
    served = client.get("/" + ok.json()["url"].split("/", 3)[3])
    assert served.status_code == 200 and served.content == PNG
    assert client.post("/api/uploads", headers=guest, files={"file": ("x.png", b"<html>nope</html>", "image/png")}).status_code == 415
    assert client.post("/api/uploads", files={"file": ("a.png", PNG, "image/png")}).status_code == 401
