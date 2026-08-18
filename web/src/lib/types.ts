export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  coverImageKey: string | null;
  autoApprove: boolean;
  organizerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicEvent {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  eventDate: string | null;
  coverImageKey: string | null;
  createdAt: string;
}

export interface Guest {
  id: string;
  name: string | null;
}

export type PhotoStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Photo {
  id: string;
  eventId: string;
  guestId: string;
  objectKey: string;
  mimeType: string;
  size: number;
  status: PhotoStatus;
  createdAt: string;
  url: string;
  reactionCount: number;
}

export interface CreateEventInput {
  name: string;
  description?: string;
  eventDate?: string;
  autoApprove?: boolean;
}
