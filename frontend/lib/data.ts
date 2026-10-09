import { GEN } from './gen';
import { IMG } from './images';
import type { Activity, Host, Listing, Review } from './types';
import { addDays, hash, rng, toISO, today } from './utils';

const img = (i: number) => IMG[i];
const N = GEN.named;

export const ASSETS = {
  loginBg: img(N.LOGIN_BG),
  signupBg: img(N.SIGNUP_BG),
  illu1: img(N.ILLU1),
  illu7: img(N.ILLU7),
  illu13: img(N.ILLU13),
  hostList: img(N.HOSTLIST),
  hostHome: (N.HOSTHOME as number[]).map(img),
  map: img(N.MAPIMG),
  kamal: img(N.KAMAL),
  kamal2: img(N.KAMAL2),
  reviewers: (N.REVIEWERS as number[]).map(img),
  meleto: (N.MELETO as number[]).map(img),
};

const COLORS = ['#7C3AED', '#0EA5E9', '#16A34A', '#F59E0B', '#DB2777', '#0D9488', '#EA580C', '#6366F1'];

export const HOSTS: Host[] = [
  ['kamal', 'Kamal', true, '10 months', 242, 4.94, ASSETS.kamal2],
  ['priya', 'Priya', true, '3 years', 318, 4.92],
  ['rohan', 'Rohan', false, '1 year', 87, 4.85],
  ['anjali', 'Anjali', true, '5 years', 540, 4.96],
  ['vikram', 'Vikram', false, '8 months', 41, 4.81],
  ['meera', 'Meera', true, '4 years', 276, 4.97],
  ['arjun', 'Arjun', false, '2 years', 129, 4.88],
  ['sneha', 'Sneha', true, '6 years', 612, 4.95],
].map((h, i) => ({
  id: h[0] as string,
  name: h[1] as string,
  superhost: h[2] as boolean,
  years: h[3] as string,
  reviews: h[4] as number,
  rating: h[5] as number,
  avatar: h[6] as string | undefined,
  color: COLORS[i],
  about: 'Superhosts are experienced, highly rated hosts who are committed to providing great stays for guests.',
}));

export const hostById = (id: string) => HOSTS.find((h) => h.id === id) || HOSTS[0];

export const AMENITIES: { id: string; label: string; icon: string; group: 'basics' | 'standout' | 'safety'; hint?: string }[] = [
  { id: 'ac', label: 'Air conditioning', icon: '❄️', group: 'basics' },
  { id: 'essentials', label: 'Essentials', icon: '🧴', group: 'basics', hint: 'Towels, bed sheets, soap and toilet paper' },
  { id: 'fridge', label: 'Fridge', icon: '🧊', group: 'basics' },
  { id: 'heating', label: 'Heating', icon: '🌡️', group: 'basics' },
  { id: 'hotwater', label: 'Hot water', icon: '♨️', group: 'basics' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳', group: 'basics' },
  { id: 'tv', label: 'TV', icon: '📺', group: 'basics' },
  { id: 'dryer', label: 'Tumble dryer', icon: '🌀', group: 'basics' },
  { id: 'washer', label: 'Washing machine', icon: '🧺', group: 'basics' },
  { id: 'wifi', label: 'Wifi', icon: '📶', group: 'basics' },
  { id: 'workspace', label: 'Dedicated workspace', icon: '💻', group: 'basics' },
  { id: 'parking', label: 'Free parking', icon: '🚗', group: 'basics' },
  { id: 'pool', label: 'Pool', icon: '🏊', group: 'standout' },
  { id: 'hottub', label: 'Hot tub', icon: '🛁', group: 'standout' },
  { id: 'patio', label: 'Patio', icon: '🪑', group: 'standout' },
  { id: 'bbq', label: 'BBQ grill', icon: '🍖', group: 'standout' },
  { id: 'firepit', label: 'Fire pit', icon: '🔥', group: 'standout' },
  { id: 'balcony', label: 'Patio or balcony', icon: '🌄', group: 'standout' },
  { id: 'garden', label: 'Back garden', icon: '🌿', group: 'standout' },
  { id: 'smoke', label: 'Smoke alarm', icon: '🚨', group: 'safety' },
  { id: 'co', label: 'Carbon monoxide alarm', icon: '🟠', group: 'safety' },
  { id: 'firstaid', label: 'First aid kit', icon: '🩹', group: 'safety' },
  { id: 'extinguisher', label: 'Fire extinguisher', icon: '🧯', group: 'safety' },
  { id: 'lock', label: 'Lock on bedroom door', icon: '🔒', group: 'basics' },
  { id: 'hairdryer', label: 'Hairdryer', icon: '💨', group: 'basics' },
  { id: 'pets', label: 'Pets allowed', icon: '🐾', group: 'standout' },
];
export const amenityLabel = (id: string) => AMENITIES.find((a) => a.id === id)?.label || id;
export const amenityIcon = (id: string) => AMENITIES.find((a) => a.id === id)?.icon || '✔️';

export const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🌐' },
  { id: 'trending', label: 'Trending', icon: '🔥' },
  { id: 'views', label: 'Amazing views', icon: '🏔️' },
  { id: 'cabins', label: 'Cabins', icon: '🛖' },
  { id: 'beach', label: 'Beachfront', icon: '🏖️' },
  { id: 'pools', label: 'Amazing pools', icon: '🏊' },
  { id: 'rooms', label: 'Rooms', icon: '🛏️' },
  { id: 'design', label: 'Design', icon: '🏛️' },
  { id: 'iconic', label: 'Iconic cities', icon: '🏙️' },
  { id: 'luxe', label: 'Luxe', icon: '💎' },
  { id: 'countryside', label: 'Countryside', icon: '🌾' },
  { id: 'camping', label: 'Camping', icon: '⛺' },
];

const CITY: Record<string, { lat: number; lng: number; state: string; tags: string[] }> = {
  Manali: { lat: 32.24, lng: 77.19, state: 'Himachal Pradesh', tags: ['views', 'cabins', 'countryside'] },
  Shimla: { lat: 31.1, lng: 77.17, state: 'Himachal Pradesh', tags: ['views', 'cabins'] },
  Kasauli: { lat: 30.9, lng: 76.96, state: 'Himachal Pradesh', tags: ['views', 'luxe', 'countryside'] },
  Chandigarh: { lat: 30.73, lng: 76.78, state: 'Chandigarh', tags: ['design', 'iconic'] },
  Zirakpur: { lat: 30.64, lng: 76.82, state: 'Punjab', tags: ['trending'] },
  Kharar: { lat: 30.75, lng: 76.65, state: 'Punjab', tags: ['trending'] },
  Gurugram: { lat: 28.46, lng: 77.03, state: 'Haryana', tags: ['iconic', 'trending'] },
  'North Goa': { lat: 15.55, lng: 73.76, state: 'Goa', tags: ['beach', 'pools', 'trending'] },
  'New Delhi': { lat: 28.61, lng: 77.2, state: 'Delhi', tags: ['iconic', 'design'] },
  Mumbai: { lat: 19.07, lng: 72.87, state: 'Maharashtra', tags: ['iconic', 'beach'] },
  Bengaluru: { lat: 12.97, lng: 77.59, state: 'Karnataka', tags: ['iconic', 'trending'] },
  Varanasi: { lat: 25.31, lng: 82.97, state: 'Uttar Pradesh', tags: ['design', 'trending'] },
  Jaipur: { lat: 26.91, lng: 75.78, state: 'Rajasthan', tags: ['design', 'luxe'] },
  Udaipur: { lat: 24.58, lng: 73.71, state: 'Rajasthan', tags: ['views', 'luxe', 'pools'] },
  Rishikesh: { lat: 30.09, lng: 78.27, state: 'Uttarakhand', tags: ['views', 'camping', 'countryside'] },
  Patiala: { lat: 30.34, lng: 76.39, state: 'Punjab', tags: ['trending', 'design'] },
  Dubai: { lat: 25.2, lng: 55.27, state: 'United Arab Emirates', tags: ['iconic', 'luxe', 'beach'] },
  Bangkok: { lat: 13.75, lng: 100.5, state: 'Thailand', tags: ['iconic', 'trending'] },
  Tokyo: { lat: 35.68, lng: 139.69, state: 'Japan', tags: ['iconic', 'design'] },
  Osaka: { lat: 34.69, lng: 135.5, state: 'Japan', tags: ['iconic', 'trending'] },
  'Kuala Lumpur': { lat: 3.14, lng: 101.69, state: 'Malaysia', tags: ['iconic', 'pools'] },
  Vancouver: { lat: 49.28, lng: -123.12, state: 'Canada', tags: ['views', 'iconic'] },
  Calgary: { lat: 51.04, lng: -114.07, state: 'Canada', tags: ['views', 'cabins'] },
  Paris: { lat: 48.85, lng: 2.35, state: 'France', tags: ['iconic', 'design'] },
  London: { lat: 51.5, lng: -0.12, state: 'United Kingdom', tags: ['iconic', 'design'] },
};
export const CITIES = Object.keys(CITY);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ADJ = ['Cozy', 'Sunny', 'Peaceful', 'Charming', 'Modern', 'Serene', 'Stylish', 'Spacious', 'Quiet', 'Bright'];
const FEAT: Record<string, string[]> = {
  views: ['with valley views', 'near the mountains', 'with a scenic balcony'],
  beach: ['near the beach', 'steps from the sand', 'with a sea breeze'],
  iconic: ['in the heart of the city', 'near the metro', 'close to the markets'],
  design: ['with designer interiors', 'with a rooftop', 'near the old town'],
  trending: ['with fast wifi', 'near the highway', 'with a workspace'],
  luxe: ['with premium finishes', 'with a private terrace', 'with butler service'],
  countryside: ['surrounded by greenery', 'on a quiet lane', 'with a garden'],
  cabins: ['in the woods', 'with a fireplace', 'with wooden interiors'],
  pools: ['with a shared pool', 'with a pool view', 'with a garden pool'],
  camping: ['by the river', 'near the ghats', 'with a bonfire'],
};

const AM_ALL = AMENITIES.map((a) => a.id);

function describe(l: { kind: string; city: string; area: string; cats: string[]; guests: number; bedrooms: number }) {
  const place = l.kind === 'Room' ? 'a private room in a welcoming home' : `an entire ${l.kind.toLowerCase()}`;
  return [
    `Enjoy ${place} in ${l.area}, ${l.city}. The space sleeps ${l.guests} and has ${l.bedrooms} bedroom${l.bedrooms > 1 ? 's' : ''}, fresh linen, hot water and quick wifi, so you can settle in as soon as you arrive.`,
    `The neighbourhood is easy to explore: cafes, local food and transport are a short walk or ride away. Your host is available to share recommendations, arrange taxis and help with anything you need during your stay.`,
    `Check-in is flexible and the home is cleaned and sanitised between every guest. Please treat the space with care and respect the quiet hours after 10 pm.`,
  ].join('\n\n');
}

type Row = [string, string, string, number, number, number, number];
const rows: Row[] = GEN.L;

const base: Listing[] = [];
const cityPool: Record<string, string[]> = {};
rows.forEach((r) => (cityPool[r[0]] = [...(cityPool[r[0]] || []), img(r[6])]));
const allPool = rows.map((r) => img(r[6]));

function make(city: string, area: string, kind: string, price: number, rating: number, fav: boolean, cover: string, idx: number, id?: string): Listing {
  const meta = CITY[city];
  const r = rng(hash(`${city}${area}${kind}${price}${idx}`));
  const pool = (cityPool[city] || allPool).filter((x) => x !== cover);
  const gallery = [cover];
  while (gallery.length < 5) {
    const c = pool[Math.floor(r() * pool.length)] || allPool[Math.floor(r() * allPool.length)];
    if (!gallery.includes(c)) gallery.push(c);
    else if (pool.length < 5) gallery.push(allPool[Math.floor(r() * allPool.length)]);
  }
  const place = kind === 'Room' ? 'room' : 'entire';
  const bedrooms = kind === 'Room' ? 1 : 1 + Math.floor(r() * 3);
  const maxGuests = kind === 'Room' ? 2 + Math.floor(r() * 2) : bedrooms * 2 + Math.floor(r() * 2);
  const cats = [...meta.tags];
  if (kind === 'Room') cats.push('rooms');
  if (kind === 'Villa' || price > 9000) cats.push('luxe');
  if (kind === 'Loft') cats.push('design');
  const nAm = 8 + Math.floor(r() * 8);
  const am = ['wifi', 'essentials', 'hotwater', 'smoke'];
  while (am.length < nAm) {
    const a = AM_ALL[Math.floor(r() * AM_ALL.length)];
    if (!am.includes(a)) am.push(a);
  }
  if (cats.includes('pools') && r() > 0.4) am.push('pool');
  const feat = FEAT[cats[0]] || FEAT.trending;
  const title = `${ADJ[Math.floor(r() * ADJ.length)]} ${kind.toLowerCase()} ${feat[Math.floor(r() * feat.length)]}`;
  const host = HOSTS[Math.floor(r() * HOSTS.length)];
  const blocked: [string, string][] = [];
  for (let k = 0; k < 2; k++) {
    const s = 6 + Math.floor(r() * 80);
    const len = 2 + Math.floor(r() * 4);
    blocked.push([toISO(addDays(today(), s)), toISO(addDays(today(), s + len))]);
  }
  return {
    id: id || `${slug(city)}-${idx}`,
    title: title.charAt(0).toUpperCase() + title.slice(1),
    kind,
    place,
    city,
    area,
    state: meta.state,
    price,
    rating,
    reviewCount: 6 + Math.floor(r() * 140),
    guestFavourite: fav,
    images: gallery,
    maxGuests,
    bedrooms,
    beds: bedrooms + (r() > 0.6 ? 1 : 0),
    baths: Math.max(1, Math.round(bedrooms * (0.6 + r() * 0.6))),
    amenities: am,
    categories: cats,
    hostId: host.id,
    description: describe({ kind, city, area, cats, guests: maxGuests, bedrooms }),
    instantBook: r() > 0.5,
    selfCheckIn: r() > 0.4,
    freeCancel: r() > 0.3,
    lat: meta.lat + (r() - 0.5) * 0.08,
    lng: meta.lng + (r() - 0.5) * 0.08,
    blocked,
    weeklyDiscount: 10,
    monthlyDiscount: 15,
  };
}

const cityCount: Record<string, number> = {};
rows.forEach((r) => {
  const [city, , title, price, rating, fav, im] = r;
  const m = title.match(/^(\S+) in (.*)$/);
  const kind = m ? m[1] : 'Flat';
  let area = m ? m[2] : city;
  cityCount[city] = (cityCount[city] || 0) + 1;
  const idx = cityCount[city];
  const isMeleto = city === 'Manali' && area === 'Vashist' && price === 979;
  const l = make(city, area, kind, price, rating, !!fav, img(im), idx, isMeleto ? 'meleto-woods' : undefined);
  if (isMeleto) {
    l.title = 'Budget Queen Room in Meleto woods';
    l.images = ASSETS.meleto;
    l.hostId = 'kamal';
    l.reviewCount = 34;
    l.rating = 4.94;
    l.guestFavourite = true;
    l.selfCheckIn = true;
    l.maxGuests = 2;
    l.beds = 1;
    l.amenities = ['lock', 'wifi', 'parking', 'pets', 'washer', 'balcony', 'garden', 'hairdryer', 'co', 'smoke', 'kitchen', 'hotwater', 'essentials', 'heating', 'tv', 'fridge', 'workspace', 'firstaid', 'extinguisher', 'ac'];
    l.description =
      "READ BEFORE YOU BOOK:\n★ This unique cottage name is Meleto woods and this listing is a 1st floor bedroom.\n★ We have a living area for all guests (shared basis).\n★ In Manali, it's situated in the Vashisht area, a 4-6 minute drive from Mall Road and the bus stand (2.5 km). The road will be steep at the end and there will be stairs in the property, so kindly take that into consideration before booking.\n★ Hot water is available round the clock and the kitchen can be used on request. Quiet hours begin at 10 pm.";
    l.lat = 32.2646;
    l.lng = 77.1912;
  }
  base.push(l);
});

const EXTRA: [string, string, string, number][] = [
  ['New Delhi', 'Hauz Khas', 'Flat', 3200], ['New Delhi', 'Greater Kailash', 'Apartment', 5400], ['New Delhi', 'Lajpat Nagar', 'Room', 1450],
  ['Mumbai', 'Bandra West', 'Apartment', 7800], ['Mumbai', 'Andheri', 'Flat', 3900], ['Mumbai', 'Juhu', 'Villa', 14500],
  ['Bengaluru', 'Indiranagar', 'Flat', 3600], ['Bengaluru', 'Koramangala', 'Apartment', 4200], ['Bengaluru', 'Whitefield', 'Room', 1700],
  ['Varanasi', 'Assi Ghat', 'Room', 1250], ['Varanasi', 'Godowlia', 'Home', 3300],
  ['Jaipur', 'C Scheme', 'Villa', 9800], ['Jaipur', 'Malviya Nagar', 'Flat', 2600],
  ['Udaipur', 'Lake Pichola', 'Villa', 12500], ['Udaipur', 'Fatehpura', 'Room', 1900],
  ['Rishikesh', 'Tapovan', 'Cabin', 2400], ['Rishikesh', 'Laxman Jhula', 'Room', 1100],
  ['Patiala', 'Leela Bhawan', 'Flat', 2100], ['Patiala', 'Urban Estate', 'Home', 3400], ['Patiala', 'Model Town', 'Room', 1200],
];
const INTL: [string, string, string, number][] = [
  ['Dubai', 'Downtown Dubai', 'Apartment', 14200], ['Dubai', 'Marina', 'Flat', 9800],
  ['Bangkok', 'Sukhumvit', 'Flat', 4800], ['Bangkok', 'Silom', 'Apartment', 6200],
  ['Tokyo', 'Shinjuku', 'Apartment', 8900], ['Tokyo', 'Shibuya', 'Flat', 10400],
  ['Osaka', 'Namba', 'Flat', 6700], ['Kuala Lumpur', 'KLCC', 'Apartment', 5400],
  ['Vancouver', 'Coal Harbour', 'Apartment', 13800], ['Calgary', 'Beltline', 'Flat', 9100],
  ['Paris', 'Le Marais', 'Apartment', 16500], ['London', 'Notting Hill', 'Flat', 15200],
];
const destCover: Record<string, string> = {};
(GEN.dest as [string, string, number][]).concat(GEN.dest2 as [string, string, number][]).forEach((d) => (destCover[d[0]] = img(d[2])));
destCover['Tokyo'] = destCover['Tokyo'] || img((GEN.dest as [string, string, number][])[2][2]);
INTL.forEach((e) => {
  const r = rng(hash(e.join('')));
  cityCount[e[0]] = (cityCount[e[0]] || 0) + 1;
  const cover = destCover[e[0]] || allPool[Math.floor(r() * allPool.length)];
  base.push(make(e[0], e[1], e[2], e[3], Math.round((4.7 + r() * 0.3) * 100) / 100, r() > 0.4, cover, cityCount[e[0]]));
});

EXTRA.forEach((e, i) => {
  const r = rng(hash(e.join('')));
  const cover = allPool[Math.floor(r() * allPool.length)];
  cityCount[e[0]] = (cityCount[e[0]] || 0) + 1;
  base.push(make(e[0], e[1], e[2], e[3], Math.round((4.7 + r() * 0.3) * 100) / 100, r() > 0.4, cover, cityCount[e[0]]));
});

export const SEED_LISTINGS: Listing[] = base;

export const SEED_HOST_LISTING_IDS = new Set(base.map((b) => b.id));

const REVIEW_POOL = [
  'It was a great stay with amazing views. A bit offbeat and close to nature.',
  'Lovely place and the hosts were very friendly. Everything was clean and exactly as described.',
  'Awesome experience, hosts were super helpful. Perfect place for a peaceful vacation.',
  'Place was good, value for money. Just a bit of a parking issue.',
  'One of our best stays ever. Would definitely come back.',
  'Great location and a comfortable bed. Check-in was smooth and quick.',
  'The host went out of the way to help us with local tips. Highly recommended.',
  'Very cosy and quiet. Wifi was fast enough to work from here for a few days.',
  'Clean, safe and well maintained. The kitchen had everything we needed.',
  'Amazing hospitality. The photos match the place perfectly.',
];
const REVIEWERS = ['Karthik', 'Anushka', 'Chandramani', 'Seema', 'Vishal', 'Ayub', 'Neha', 'Gurpreet', 'Ishaan', 'Simran', 'Aarav', 'Tanvi'];
const SINCE = ['2 years on Airbnb', '1 month on Airbnb', '11 months on Airbnb', '3 years on Airbnb', '4 months on Airbnb', '6 years on Airbnb'];
const WHEN = ['5 days ago', '1 week ago', '2 weeks ago', '3 weeks ago', 'August 2026', 'September 2026', 'July 2026', 'June 2026'];

export function reviewsFor(l: Listing): Review[] {
  const r = rng(hash(l.id));
  const out: Review[] = [];
  const names = [...REVIEWERS].sort(() => r() - 0.5);
  for (let i = 0; i < 8; i++) {
    out.push({
      id: `${l.id}-r${i}`,
      name: names[i],
      avatar: i < 5 && l.id === 'meleto-woods' ? ASSETS.reviewers[i] : undefined,
      since: SINCE[Math.floor(r() * SINCE.length)],
      when: WHEN[i % WHEN.length],
      stars: r() > 0.8 ? 4 : 5,
      text: REVIEW_POOL[(i + Math.floor(r() * 3)) % REVIEW_POOL.length],
    });
  }
  return out;
}

export const RATING_BREAKDOWN = (l: Listing) => {
  const r = rng(hash(l.id + 'rb'));
  const v = () => Math.min(5, Math.round((l.rating - 0.15 + r() * 0.25) * 10) / 10).toFixed(1);
  return [
    { label: 'Cleanliness', value: v(), icon: '🧼' },
    { label: 'Accuracy', value: v(), icon: '✔️' },
    { label: 'Check-in', value: v(), icon: '🔑' },
    { label: 'Communication', value: v(), icon: '💬' },
    { label: 'Location', value: v(), icon: '🗺️' },
  ];
};

const dest = GEN.dest as [string, string, number][];
const dest2 = GEN.dest2 as [string, string, number][];
export const DESTINATIONS = dest.map((d) => ({ name: d[0], sub: d[1], image: img(d[2]) }));
export const DESTINATIONS2 = dest2.map((d) => ({ name: d[0], sub: d[1], image: img(d[2]) }));

export const SUGGESTED_WHERE = [
  { icon: '🏖️', name: 'Gurgaon District, Haryana', sub: 'Popular destination', q: 'Gurugram' },
  { icon: '🌊', name: 'North Goa, Goa', sub: 'Popular beach destination', q: 'North Goa' },
  { icon: '🏛️', name: 'New Delhi, Delhi', sub: 'For sights like India Gate', q: 'New Delhi' },
  { icon: '🏙️', name: 'Mumbai, Maharashtra', sub: 'For its top-notch dining', q: 'Mumbai' },
  { icon: '🪔', name: 'Varanasi, Uttar Pradesh', sub: 'A hidden gem', q: 'Varanasi' },
  { icon: '🌳', name: 'Bengaluru, Karnataka', sub: 'For sights like Lalbagh Botanical Garden', q: 'Bengaluru' },
];

export const ALL_PLACES = [
  ...SUGGESTED_WHERE.map((s) => ({ icon: s.icon, name: s.name, sub: s.sub, q: s.q })),
  ...['Manali', 'Shimla', 'Chandigarh', 'Kasauli', 'Zirakpur', 'Kharar', 'Jaipur', 'Udaipur', 'Rishikesh', 'Patiala'].map((c) => ({
    icon: '📍', name: `${c}, ${CITY[c].state}`, sub: 'Popular destination', q: c,
  })),
];

export const HOME_ROWS = [
  { title: 'Check out homes in Manali', city: 'Manali' },
  { title: 'Popular homes in Chandigarh', city: 'Chandigarh' },
  { title: 'Places to stay in Shimla', city: 'Shimla' },
];
export const HOMES_ROWS = [
  { title: 'Available in Zirakpur this weekend', city: 'Zirakpur', nights: 2 },
  { title: 'Stay in Gurgaon District', city: 'Gurugram', nights: 1 },
  { title: 'Available in Kharar this weekend', city: 'Kharar', nights: 2 },
  { title: 'Homes in North Goa', city: 'North Goa', nights: 1 },
  { title: 'Available in Kasauli this weekend', city: 'Kasauli', nights: 2 },
];

export const INSPIRATION: Record<string, [string, string][]> = {
  Popular: [['Tokyo', 'Holiday rentals'], ['Pocono Mountains', 'House rentals'], ['Raleigh', 'House rentals'], ['Kauai', 'Monthly Rentals'], ['Nashville', 'Monthly Rentals'], ['Montreal', 'House rentals'], ['Barcelona', 'Flat rentals'], ['Daytona Beach', 'Villa rentals'], ['Brooklyn', 'Monthly Rentals'], ['Galveston', 'Villa rentals'], ['Outer Banks', 'Flat rentals'], ['Chicago', 'Flat rentals'], ['St. Petersburg', 'Holiday rentals'], ['Broken Bow', 'House rentals'], ['Memphis', 'House rentals'], ['Pittsburgh', 'House rentals'], ['Destin', 'Holiday rentals']],
  'Arts & culture': [['Jaipur', 'House rentals'], ['Varanasi', 'Flat rentals'], ['Udaipur', 'Villa rentals'], ['New Delhi', 'Flat rentals'], ['Chandigarh', 'Flat rentals'], ['Patiala', 'Holiday rentals'], ['Mumbai', 'Flat rentals'], ['Bengaluru', 'Flat rentals'], ['Shimla', 'Flat rentals'], ['Kasauli', 'Villa rentals'], ['Rishikesh', 'Cabin rentals'], ['Manali', 'House rentals']],
  Beach: [['North Goa', 'Villa rentals'], ['Mumbai', 'Flat rentals'], ['Kauai', 'Monthly Rentals'], ['Daytona Beach', 'Villa rentals'], ['Galveston', 'Villa rentals'], ['Destin', 'Holiday rentals'], ['Outer Banks', 'Flat rentals'], ['Barcelona', 'Flat rentals']],
  Mountains: [['Manali', 'House rentals'], ['Shimla', 'Flat rentals'], ['Kasauli', 'Villa rentals'], ['Rishikesh', 'Cabin rentals'], ['Pocono Mountains', 'House rentals'], ['Broken Bow', 'House rentals']],
  Outdoors: [['Rishikesh', 'Cabin rentals'], ['Manali', 'Cabin rentals'], ['Kasauli', 'Holiday rentals'], ['Shimla', 'House rentals'], ['Broken Bow', 'House rentals'], ['Outer Banks', 'Flat rentals']],
  'Things to do': [['Jaipur', 'Holiday rentals'], ['Varanasi', 'Holiday rentals'], ['New Delhi', 'Holiday rentals'], ['Mumbai', 'Holiday rentals'], ['North Goa', 'Holiday rentals'], ['Bengaluru', 'Holiday rentals']],
};

const E = GEN.E as [string, string, string, string, number, number, string, number, string][];
const S = GEN.S as [string, string, string, number, number, string, number, number][];

const cityOfTitle = (t: string) => {
  const m = ['Chandigarh', 'Shimla', 'Agra', 'Delhi', 'Mussoorie', 'Rishikesh', 'Landour', 'Dhanaulti', 'Gaiety'].find((c) => t.includes(c));
  if (!m) return 'Chandigarh';
  if (m === 'Gaiety' || m === 'Landour') return m === 'Gaiety' ? 'Shimla' : 'Mussoorie';
  if (m === 'Delhi') return 'New Delhi';
  if (m === 'Dhanaulti') return 'Mussoorie';
  return m;
};

const ORIGINALS: Record<number, { title: string; location: string; coming?: string }> = {
  7: { title: 'Make the perfect Caesar salad with Nara Smith', location: 'Brooklyn, United States', coming: 'Coming 9 October' },
  8: { title: "Play in Katie McCabe's five-a-side tournament", location: 'Dartford, United Kingdom', coming: 'Coming 9 October' },
  9: { title: 'Carve marble with a third-generation sculptor', location: 'Athens, Greece' },
  10: { title: 'Savor Premium Matcha in a tea ceremony in Shibuya', location: 'Shibuya, Japan' },
  11: { title: "Insider's Food Tour: South Philly & Italian Market", location: 'Philadelphia, United States' },
  12: { title: "Join Sydney Bird Club's co-founder for a birdwatch", location: 'Centennial Park, Australia' },
  13: { title: 'Sipping Mexico: A Journey Through Mexican Spirits', location: 'Tulum, Mexico' },
};

const EXP_HOSTS = ['Aman', 'Ritika', 'Harpreet', 'Sanjay', 'Divya', 'Tarun', 'Mehak', 'Rahul'];

export const EXPERIENCES: Activity[] = E.map((e, i) => {
  const o = ORIGINALS[i];
  const r = rng(hash('exp' + i));
  const title = o ? o.title : e[3];
  const city = o ? o.location.split(',')[0] : cityOfTitle(title);
  const sec = e[0] === 'Experiences this weekend' ? 'weekend' : e[0] === 'Airbnb Originals' ? 'original' : e[0].startsWith('All experiences') ? 'patiala' : 'popular';
  return {
    id: `exp-${i + 1}`,
    kind: 'experience',
    title,
    city,
    price: e[4] || 2500 + Math.floor(r() * 4000),
    unit: (e[6] as 'guest' | 'group') || 'guest',
    rating: e[5],
    image: img(e[7]),
    badge: e[1] ? e[1].trim() : undefined,
    when: e[2] ? e[2].trim() : undefined,
    section: sec,
    location: o?.location,
    comingSoon: o?.coming,
    host: EXP_HOSTS[i % EXP_HOSTS.length],
    duration: `${2 + (i % 4)} hours`,
    description: `Join ${EXP_HOSTS[i % EXP_HOSTS.length]}, a local guide, for a hands-on experience in ${city}. You'll explore hidden corners, hear the stories behind them and meet people who live and work there. Small groups, flexible pace and plenty of time for photos.`,
  };
});

const SERVICE_CAT = (t: string) =>
  /photo|portrait|story filled|shoot/i.test(t) ? 'Photography' : /hair/i.test(t) ? 'Hair' : /breath|flow/i.test(t) ? 'Training' : /makeup|make-up|glam|bridal|look/i.test(t) ? 'Make-up' : 'Make-up';
export const SERVICE_TYPES = ['Photography', 'Chefs', 'Massage', 'Prepared meals', 'Training', 'Make-up', 'Hair', 'Spa treatments', 'Catering'];

export const SERVICES: Activity[] = S.map((s, i) => {
  const city = s[0].replace('Services in ', '');
  return {
    id: `svc-${i + 1}`,
    kind: 'service',
    title: s[2],
    city,
    price: s[3],
    unit: (s[5] as 'guest' | 'group') || 'guest',
    rating: s[4],
    image: img(s[7]),
    badge: s[1] || undefined,
    section: city,
    category: SERVICE_CAT(s[2]),
    minimum: s[6] || undefined,
    host: ['Sukoon', 'Albrun', 'Vishal', 'Nisha', 'Rohit', 'Manisha', 'Happy'][i % 7],
    duration: '2 hours',
    description: `A professional ${SERVICE_CAT(s[2]).toLowerCase()} service delivered at your stay or a location of your choice in ${city}. Book a slot, share your preferences and your provider will confirm the details with you before the session.`,
  };
});

export const FAQ = [
  ['What are Airbnb\'s fees?', 'Listing your space is completely free. Once you receive a reservation, Airbnb generally charges hosts a flat 3% service fee of the booking subtotal to cover credit card processing and round-the-clock host customer support.'],
  ['Any tips on being a great host?', 'Focus on providing immaculate cleanliness, responsive messaging, and authentic local recommendations. Simple touches like complimentary tea, high-speed WiFi, and clear check-in instructions consistently drive 5-star ratings.'],
  ['What if I have other questions?', 'You can connect one-on-one with a local Superhost in your region for free guidance, or access the Airbnb Community Center and 24/7 specialized Support Team at any step during your hosting journey.'],
];

export const PLACE_TYPES = ['House', 'Flat/apartment', 'Barn', 'Bed & breakfast', 'Boat', 'Cabin', 'Campervan/motorhome', 'Casa particular', 'Castle', 'Cave', 'Container', 'Cycladic home', 'Dammuso', 'Dome', 'Earth home'];
