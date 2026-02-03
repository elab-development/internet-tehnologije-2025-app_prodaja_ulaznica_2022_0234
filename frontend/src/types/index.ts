export interface User {
  id: number;
  korisnickoIme: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  ime?: string;
  prezime?: string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  location: string;
  image?: string;
  available_tickets?: number;
  total_tickets?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TicketType {
  id: number;
  event_id: number;
  name: string;
  price: number;
  quantity: number;
  available_quantity: number;
  description?: string;
}

export interface Purchase {
  id: number;
  user_id: number;
  event_id: number;
  status: 'PENDING' | 'AWAITING_PAYMENT' | 'PAID' | 'CANCELLED';
  total_price: number;
  session_start_time?: string;
  created_at: string;
  tickets?: Ticket[];
}

export interface Ticket {
  id: number;
  purchase_id: number;
  ticket_type_id: number;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  price: number;
}