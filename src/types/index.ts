export type UserRole = 'client' | 'worker' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: any;
  lastLogin?: any;
}

export interface WorkerProfile {
  uid: string;
  name: string;
  profileImage: string;
  phoneNumber: string;
  city: string;
  area: string;
  category: string;
  experience: number;
  bio: string;
  isApproved: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export const CATEGORIES = [
  'Plumber',
  'Electrician',
  'AC Technician',
  'Carpenter',
  'Painter',
  'Mechanic',
  'Cleaner',
  'Gardener',
  'Handyman'
];

export const PAK_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Faisalabad',
  'Rawalpindi',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala'
];
