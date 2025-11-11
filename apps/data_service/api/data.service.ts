/**
 * Data Service
 * Unified database access layer for all Zenith microservices
 */

export interface DataService {
  // User operations
  users: {
    create(data: CreateUserDTO): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, data: UpdateUserDTO): Promise<User>;
    delete(id: string): Promise<void>;
  };
  
  // Subscription operations
  subscriptions: {
    create(data: CreateSubscriptionDTO): Promise<Subscription>;
    findByUserId(userId: string): Promise<Subscription[]>;
    update(id: string, data: UpdateSubscriptionDTO): Promise<Subscription>;
    cancel(id: string): Promise<Subscription>;
  };
  
  // Message operations
  messages: {
    create(data: CreateMessageDTO): Promise<Message>;
    findByParticipant(userId: string): Promise<Message[]>;
    markAsRead(messageId: string, userId: string): Promise<void>;
  };
  
  // Booking operations
  bookings: {
    create(data: CreateBookingDTO): Promise<Booking>;
    findByUser(userId: string): Promise<Booking[]>;
    update(id: string, data: UpdateBookingDTO): Promise<Booking>;
    cancel(id: string): Promise<Booking>;
  };
}
