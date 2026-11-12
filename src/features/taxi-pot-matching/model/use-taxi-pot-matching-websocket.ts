'use client';

import { useEffect, useRef } from 'react';

import { getAccessToken } from '@/entities/auth';
import { ChatWebSocketClient } from '@/entities/chat';

import { getCurrentTaxiPot } from '@/features/taxi-pot-matching/api/taxi-pot-matching';

type UseTaxiPotMatchingWebSocketOptions = {
  onMatched: (chatRoomId: number) => void;
};

export function useTaxiPotMatchingWebSocket({ onMatched }: UseTaxiPotMatchingWebSocketOptions) {
  const onMatchedRef = useRef(onMatched);

  useEffect(() => {
    onMatchedRef.current = onMatched;
  }, [onMatched]);

  useEffect(() => {
    let disposed = false;
    let client: ChatWebSocketClient | null = null;

    const syncCurrentTaxiPot = async () => {
      try {
        const response = await getCurrentTaxiPot();
        const currentTaxiPot = response.data;

        if (!disposed && currentTaxiPot && currentTaxiPot.status !== 'MATCHING') {
          onMatchedRef.current(currentTaxiPot.chat_room_id);
        }
      } catch {
        // The matching dialog remains visible until a websocket event or a later retry.
      }
    };

    getAccessToken()
      .then((accessToken) => {
        if (disposed) {
          return;
        }

        client = new ChatWebSocketClient({
          accessToken,
          onTaxiPotMatched: (message) => {
            if (!disposed) {
              onMatchedRef.current(message.chat_room_id);
            }
          },
          subscribeTaxiPotMatching: true,
        });

        void syncCurrentTaxiPot();
        return client.connect();
      })
      .catch(() => {
        // The matching dialog remains visible until a later retry or a new entry attempt.
      });

    return () => {
      disposed = true;
      client?.disconnect();
    };
  }, []);
}
