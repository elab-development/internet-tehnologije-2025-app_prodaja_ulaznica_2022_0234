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
  category: string;  
  price: number;
  quantity_total: number;  
  quantity_sold: number;  
  sales_start_at: string;  
  sales_end_at: string;    
  is_active: boolean;      
  description?: string;
}

export interface Purchase {
  id: number;
  user_id: number;
  event_id: number;
  ticket_type_id: number;  
  quantity: number;         
  unit_price: number;       
  total_amount: number;     
  status: 'PENDING' | 'RESERVED' | 'AWAITING_PAYMENT' | 'PAID' | 'CANCELLED';
  reserved_until?: string;  
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

export interface QueueStatus {
  in_queue: boolean;
  position?: number;
  total_in_queue?: number;
  estimated_wait_minutes?: number;
  can_purchase: boolean;
}