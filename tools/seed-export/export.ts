import { writeFileSync } from 'fs';
import { AMENITIES, ASSETS, CATEGORIES, DESTINATIONS, DESTINATIONS2, EXPERIENCES, HOSTS, SEED_LISTINGS, SERVICES } from './data';
import { fromISO, today } from './utils';

const t0 = today().getTime();
const off = (s: string) => Math.round((fromISO(s).getTime() - t0) / 86400000);

const listings = SEED_LISTINGS.map((l, i) => ({
  rank: i,
  id: l.id, title: l.title, kind: l.kind, place: l.place, city: l.city, area: l.area, state: l.state,
  price: l.price, rating: l.rating, reviewCount: l.reviewCount, guestFavourite: l.guestFavourite,
  images: l.images, maxGuests: l.maxGuests, bedrooms: l.bedrooms, beds: l.beds, baths: l.baths,
  amenities: l.amenities, categories: l.categories, hostId: l.hostId, description: l.description,
  instantBook: l.instantBook, selfCheckIn: l.selfCheckIn, freeCancel: l.freeCancel, lat: l.lat, lng: l.lng,
  weeklyDiscount: l.weeklyDiscount, monthlyDiscount: l.monthlyDiscount,
  bookedOffsets: (l.blocked || []).map(([a, b]) => [off(a), off(b)]),
}));

const out = {
  hosts: HOSTS.map((h) => ({ id: h.id, name: h.name, years: h.years, avatar: h.avatar || null })),
  amenities: AMENITIES,
  categories: CATEGORIES,
  listings,
  experiences: EXPERIENCES,
  services: SERVICES,
  destinations: DESTINATIONS,
  destinationsAlt: DESTINATIONS2,
  reviewerAvatars: ASSETS.reviewers,
};
writeFileSync('../../backend/app/seed_data/seed.json', JSON.stringify(out));
console.log('listings', listings.length, 'experiences', EXPERIENCES.length, 'services', SERVICES.length, 'hosts', HOSTS.length);
