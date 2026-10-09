"""Static geo helpers: coordinates and discovery categories for known cities."""
import hashlib

CITY = {
    "Manali": (32.24, 77.19, "Himachal Pradesh", ["views", "cabins", "countryside"]),
    "Shimla": (31.10, 77.17, "Himachal Pradesh", ["views", "cabins"]),
    "Kasauli": (30.90, 76.96, "Himachal Pradesh", ["views", "luxe", "countryside"]),
    "Chandigarh": (30.73, 76.78, "Chandigarh", ["design", "iconic"]),
    "Zirakpur": (30.64, 76.82, "Punjab", ["trending"]),
    "Kharar": (30.75, 76.65, "Punjab", ["trending"]),
    "Gurugram": (28.46, 77.03, "Haryana", ["iconic", "trending"]),
    "North Goa": (15.55, 73.76, "Goa", ["beach", "pools", "trending"]),
    "New Delhi": (28.61, 77.20, "Delhi", ["iconic", "design"]),
    "Mumbai": (19.07, 72.87, "Maharashtra", ["iconic", "beach"]),
    "Bengaluru": (12.97, 77.59, "Karnataka", ["iconic", "trending"]),
    "Varanasi": (25.31, 82.97, "Uttar Pradesh", ["design", "trending"]),
    "Jaipur": (26.91, 75.78, "Rajasthan", ["design", "luxe"]),
    "Udaipur": (24.58, 73.71, "Rajasthan", ["views", "luxe", "pools"]),
    "Rishikesh": (30.09, 78.27, "Uttarakhand", ["views", "camping", "countryside"]),
    "Patiala": (30.34, 76.39, "Punjab", ["trending", "design"]),
}
DEFAULT = (28.61, 77.20)


def coords_for(city: str, seed: str) -> tuple[float, float]:
    lat, lng = CITY.get(city, (*DEFAULT, "", []))[:2]
    h = int(hashlib.sha1(seed.encode()).hexdigest(), 16)
    return round(lat + ((h % 1000) / 1000 - 0.5) * 0.08, 5), round(lng + (((h >> 10) % 1000) / 1000 - 0.5) * 0.08, 5)


def categories_for(city: str, place: str, price: int, kind: str) -> list[str]:
    cats = list(CITY.get(city, (0, 0, "", ["trending"]))[3]) or ["trending"]
    if "trending" not in cats and city not in CITY:
        cats.append("trending")
    if place == "room":
        cats.append("rooms")
    if kind in ("Villa",) or price > 9000:
        cats.append("luxe")
    if kind == "Loft":
        cats.append("design")
    return list(dict.fromkeys(cats))
