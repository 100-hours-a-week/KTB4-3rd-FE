export type ChatCarpoolTab = 'chat' | 'carpool';
export type CarpoolRequestDirection = 'SENT' | 'RECEIVED';
export type CarpoolRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export type CarpoolUser = {
  id: number;
  name: string;
  profile_image_url: string | null;
};

export type CarpoolRequestSummary = {
  id: number;
  carpool_id: number;
  counterpart: CarpoolUser;
  origin_name: string;
  dest_name: string;
  departure_at: string;
  content: string;
  created_at: string;
};

export type CarpoolSentRequest = CarpoolRequestSummary & {
  status: CarpoolRequestStatus;
  chat_room_id?: number | null;
};

export type CarpoolReceivedRequest = CarpoolRequestSummary & {
  status: 'PENDING';
};
