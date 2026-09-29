import type { CompanionTransport } from '@/entities/post';

export type CompanionPostCreatePayload = {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  dest_name: string;
  dest_lat: number;
  dest_lng: number;
  departure_at: string;
  transport_type: CompanionTransport;
  recruit_count: number;
  content?: string;
};

export type CommunityPostCreatePayload = {
  title: string;
  content: string;
  lat: number;
  lng: number;
};
