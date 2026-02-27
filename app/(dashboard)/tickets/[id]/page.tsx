import { redirect } from 'next/navigation';

export default function LegacyTicketIdPage({ params }: { params: { id: string } }) {
  redirect('/tickets');
}
