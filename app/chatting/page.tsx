import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '채팅',
};

export default function ChattingRoute() {
  redirect('/chatroom/101');
}
