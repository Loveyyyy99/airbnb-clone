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
  status?: string;
  blocked?: [string, string][];
  hostBlocked?: string[];
  weekend?: number;
  address?: string | null;
  pin?: string | null;
  discounts?: string[];
  bookingCount?: number;
  host?: Host;
  unavailable?: [string, string][];
  ratingBreakdown?: { label: string; value: string; icon: string }[];
  ratingHistogram?: number[];
  weeklyDiscount?: number;
  monthlyDiscount?: number;
}

export interface Activity {
  id: string;
  kind: string;
  title: string;
  city: string;
  price: number;
  unit: 'guest' | 'group';
  rating: number;
  image: string;
  badge?: string | null;
  when?: string | null;
  section: string;
  category?: string | null;
  minimum?: number | null;
  location?: string | null;
  comingSoon?: string | null;
  host: string;
  duration: string;
  description: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dob?: string | null;
  avatarUrl?: string | null;
  isHost: boolean;
  profile: Profile;
  createdAt: string;
}

export interface BookingBrief {
  id: string;
  title: string;
  kind: string;
  area: string;
  city: string;
  image: string;
  instantBook: boolean;
  freeCancel: boolean;
}

export interface Booking {
  id: string;
  code: string;
  listingId: string;
  userId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants: number;
  pets: number;
  nights: number;
  nightly: number;
  subtotal: number;
  discountAmount: number;
  discountType?: string | null;
  cleaning: number;
  service: number;
  total: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'declined';
  createdAt: string;
  listing: BookingBrief;
  canReview: boolean;
  reviewed: boolean;
}

export interface Quote {
  available: boolean;
  reason?: string | null;
  nights: number;
  nightlyAvg: number;
  subtotal: number;
  discount?: { type: string; label: string; pct: number; amount: number } | null;
  cleaningFee: number;
  serviceFee: number;
  total: number;
}

export interface ActivityBooking {
  id: string;
  code: string;
  day: string;
  guests: number;
  total: number;
  status: string;
  createdAt: string;
  activity: Activity;
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
  senderId: string;
  from: 'host' | 'guest';
  name: string;
  text: string;
  at: string;
}

export interface Thread {
  id: string;
  guest: string;
  guestId: string;
  listingId: string;
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
}
