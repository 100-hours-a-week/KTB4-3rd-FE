export type CarPoolListItem = {
  id: number;
  host: { name: string; profile_image_url: string | null };
  origin_name: string;
  dest_name: string;
  departure_at: string;
  distance_m: number;
  current_count: number;
  capacity: number;
  is_full: boolean;
  is_expired: boolean;
};
