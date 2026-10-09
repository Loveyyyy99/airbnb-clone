export type PlaceKind = 'entire' | 'room' | 'shared';

export interface Host {
  id: string;
  name: string;
  superhost: boolean;
  years: string;
  avatar?: string;
  color: string;
  reviews: number;
  rating: number;
  about: string;
}

export interface Review {
  id: string;
  name: string;
  avatar?: string;
  since: string;
  when: string;
  stars: number;
  text: string;
}

export interface Listing {
  id: string;
  title: string;
  kind: string;
  place: PlaceKind;
  city: string;
  area: string;
  state: string;
  price: number;
  rating: number;
  reviewCount: number;
  guestFavourite: boolean;
  images: string[];
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  categories: string[];
  hostId: string;
  description: string;
  instantBook: boolean;
  selfCheckIn: boolean;
  freeCancel: boolean;
  lat: number;
  lng: number;
  ownerId?: string;
  status?: 'published' | 'draft';
  blocked?: [string, string][];
  hostBlocked?: string[];
  weekend?: number;
  weeklyDiscount?: number;
  monthlyDiscount?: number;
}

export interface Activity {
  id: string;
  kind: 'experience' | 'service';
  title: string;
  city: string;
  price: number;
  unit: 'guest' | 'group';
  rating: number;
  image: string;
  badge?: string;
  when?: string;
  section: string;
  category?: string;
  minimum?: number;
  location?: string;
  comingSoon?: string;
  host: string;
  duration: string;
  description: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  listingId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  nights: number;
  nightly: number;
  cleaning: number;
  service: number;
  total: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  guestName: string;
  code: string;
}

export interface ActivityBooking {
  id: string;
  activityId: string;
  userId: string;
  date: string;
  guests: number;
  total: number;
  createdAt: string;
  code: string;
}

export interface GuestCount {
  adults: number;
  children: number;
  infants: number;
  pets: number;
}

export interface SearchState {
  where: string;
  checkIn: string;
  checkOut: string;
  guests: GuestCount;
}

export interface Draft {
  id: string;
  step: number;
  kind: string;
  place: PlaceKind;
  address: string;
  city: string;
  state: string;
  area: string;
  pin: string;
  precise: boolean;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  amenities: string[];
  photos: string[];
  title: string;
  highlights: string[];
  description: string;
  instantBook: boolean;
  price: number;
  weekend: number;
  discounts: string[];
  safety: string[];
  cameraNote: string;
  business: boolean | null;
  street: string;
  flat: string;
  landmark: string;
  locality: string;
}

export interface Message {
  id: string;
  from: 'host' | 'guest';
  name: string;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  guest: string;
  listingTitle: string;
  messages: Message[];
}

export interface Profile {
  school: string;
  work: string;
  dream: string;
  pets: string;
  decade: string;
  fun: string;
  song: string;
  skill: string;
  time: string;
  languages: string;
  intro: string;
  interests: string[];
  stamps: boolean;
  photo: string;
}
