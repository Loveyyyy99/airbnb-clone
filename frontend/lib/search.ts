import type { GuestCount } from './types';

export interface Filters {
  where: string;
  checkIn: string;
  checkOut: string;
  guests: GuestCount;
  category: string;
  minPrice: number;
  maxPrice: number;
  place: 'any' | 'room' | 'entire';
  bedrooms: number;
  beds: number;
  baths: number;
  kinds: string[];
  amenities: string[];
  instantBook: boolean;
  selfCheckIn: boolean;
  freeCancel: boolean;
  favourite: boolean;
  sort: 'recommended' | 'low' | 'high' | 'rating';
}

export const defaultFilters: Filters = {
  where: '', checkIn: '', checkOut: '', guests: { adults: 0, children: 0, infants: 0, pets: 0 },
  category: 'all', minPrice: 0, maxPrice: 40000, place: 'any', bedrooms: 0, beds: 0, baths: 0,
  kinds: [], amenities: [], instantBook: false, selfCheckIn: false, freeCancel: false, favourite: false, sort: 'recommended',
};

export const KIND_GROUPS = ['House', 'Apartment', 'Villa', 'Loft', 'Cabin', 'Room'];

/** Query-string params understood by GET /api/listings (also /count and /map). */
export const toApiParams = (f: Filters) => ({
  where: f.where,
  checkIn: f.checkIn,
  checkOut: f.checkIn && f.checkOut ? f.checkOut : '',
  adults: f.guests.adults,
  children: f.guests.children,
  infants: f.guests.infants,
  pets: f.guests.pets,
  category: f.category !== 'all' ? f.category : '',
  minPrice: f.minPrice > 0 ? f.minPrice : '',
  maxPrice: f.maxPrice < defaultFilters.maxPrice ? f.maxPrice : '',
  place: f.place !== 'any' ? f.place : '',
  bedrooms: f.bedrooms,
  beds: f.beds,
  baths: f.baths,
  kinds: f.kinds,
  amenities: f.amenities,
  instantBook: f.instantBook,
  selfCheckIn: f.selfCheckIn,
  freeCancel: f.freeCancel,
  favourite: f.favourite,
  sort: f.sort !== 'recommended' ? f.sort : '',
});

export const filtersToQuery = (f: Partial<Filters>) => {
  const p = new URLSearchParams();
  if (f.where) p.set('where', f.where);
  if (f.checkIn) p.set('in', f.checkIn);
  if (f.checkOut) p.set('out', f.checkOut);
  if (f.guests) {
    const g = f.guests;
    if (g.adults) p.set('adults', String(g.adults));
    if (g.children) p.set('children', String(g.children));
    if (g.infants) p.set('infants', String(g.infants));
    if (g.pets) p.set('pets', String(g.pets));
  }
  return p.toString();
};

export const fullQuery = (f: Filters) => {
  const p = new URLSearchParams(filtersToQuery(f));
  if (f.category !== 'all') p.set('cat', f.category);
  if (f.minPrice > 0) p.set('min', String(f.minPrice));
  if (f.maxPrice < defaultFilters.maxPrice) p.set('max', String(f.maxPrice));
  if (f.place !== 'any') p.set('place', f.place);
  if (f.bedrooms) p.set('bedrooms', String(f.bedrooms));
  if (f.beds) p.set('beds', String(f.beds));
  if (f.baths) p.set('baths', String(f.baths));
  if (f.kinds.length) p.set('kinds', f.kinds.join(','));
  if (f.amenities.length) p.set('am', f.amenities.join(','));
  if (f.instantBook) p.set('instant', '1');
  if (f.selfCheckIn) p.set('self', '1');
  if (f.freeCancel) p.set('cancel', '1');
  if (f.favourite) p.set('fav', '1');
  if (f.sort !== 'recommended') p.set('sort', f.sort);
  return p.toString();
};
