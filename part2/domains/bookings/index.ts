/**
 * 📅 Bookings Domain
 * Business logic for date scheduling and booking management
 */

import type { Booking } from '@/types';
import { bookingsApi } from '@/lib/api';
import {
  supabaseCircuitBreaker,
  withCircuitBreaker,
} from '@/lib/circuitBreaker';

export class BookingsDomain {
  /**
   * Get user's bookings
   */
  static async getBookings(userId: string): Promise<Booking[]> {
    return withCircuitBreaker(
      supabaseCircuitBreaker,
      () => bookingsApi.getBookings(userId),
      () => [], // Fallback: empty array
    );
  }

  /**
   * Create new booking with validation
   */
  static async createBooking(
    booking: Omit<Booking, 'id' | 'createdAt'>,
  ): Promise<Booking> {
    // Validate booking
    this.validateBooking(booking);

    const newBooking = await withCircuitBreaker(supabaseCircuitBreaker, () =>
      bookingsApi.createBooking(booking),
    );

    // Emit domain event
    this.emitBookingEvent(BOOKING_EVENTS.BOOKING_CREATED, newBooking);

    return newBooking;
  }

  /**
   * Update booking status
   */
  static async updateBookingStatus(
    bookingId: string,
    status: Booking['status'],
  ): Promise<Booking> {
    const updatedBooking = await withCircuitBreaker(
      supabaseCircuitBreaker,
      () => bookingsApi.updateBookingStatus(bookingId, status),
    );

    this.emitBookingEvent(BOOKING_EVENTS.BOOKING_STATUS_UPDATED, {
      bookingId,
      status,
      booking: updatedBooking,
    });

    return updatedBooking!;
  }

  /**
   * Cancel booking
   */
  static async cancelBooking(bookingId: string): Promise<Booking> {
    return this.updateBookingStatus(bookingId, 'cancelled');
  }

  /**
   * Get booking recommendations based on profile preferences
   */
  static generateBookingSuggestions(
    profilePreferences: any,
  ): BookingSuggestion[] {
    const suggestions: BookingSuggestion[] = [];

    if (profilePreferences?.bookingPreferences?.preferredMeetingTypes) {
      profilePreferences.bookingPreferences.preferredMeetingTypes.forEach(
        (type: string) => {
          suggestions.push({
            type: type as any,
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Date`,
            description: `Perfect for a ${type} meeting`,
            estimatedCost: this.getEstimatedCost(type),
          });
        },
      );
    }

    // Add default suggestions if none from preferences
    if (suggestions.length === 0) {
      suggestions.push(
        {
          type: 'coffee',
          title: 'Coffee Meetup',
          description: 'Casual coffee chat to get to know each other',
          estimatedCost: 15,
        },
        {
          type: 'dinner',
          title: 'Dinner Date',
          description: 'Romantic dinner at a nice restaurant',
          estimatedCost: 80,
        },
        {
          type: 'activity',
          title: 'Activity Date',
          description: 'Fun activity like hiking, museum, or concert',
          estimatedCost: 50,
        },
      );
    }

    return suggestions;
  }

  /**
   * Validate booking data
   */
  private static validateBooking(
    booking: Omit<Booking, 'id' | 'createdAt'>,
  ): void {
    if (!booking.profileId) {
      throw new Error('Profile ID is required');
    }

    if (!booking.date || booking.date < new Date()) {
      throw new Error('Booking date must be in the future');
    }

    if (!booking.time) {
      throw new Error('Booking time is required');
    }

    if (!booking.location) {
      throw new Error('Location is required');
    }

    // Validate meeting type
    const validTypes = ['coffee', 'dinner', 'drinks', 'activity', 'custom'];
    if (booking.meetingType && !validTypes.includes(booking.meetingType)) {
      throw new Error('Invalid meeting type');
    }

    // Validate booking preferences
    if (booking.bookingPreferences) {
      const prefs = booking.bookingPreferences;

      if (prefs.budgetRange && prefs.budgetRange[0] > prefs.budgetRange[1]) {
        throw new Error('Invalid budget range');
      }

      if (
        prefs.budgetRange &&
        (prefs.budgetRange[0] < 0 || prefs.budgetRange[1] < 0)
      ) {
        throw new Error('Budget cannot be negative');
      }
    }
  }

  /**
   * Get estimated cost for meeting type
   */
  private static getEstimatedCost(meetingType: string): number {
    const costs: Record<string, number> = {
      coffee: 15,
      drinks: 40,
      dinner: 80,
      activity: 50,
      custom: 30,
    };

    return costs[meetingType] || 30;
  }

  /**
   * Emit domain events
   */
  private static emitBookingEvent(event: BookingEvent, data: any): void {
    console.log(`Booking Event: ${event}`, data);
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// Booking suggestion interface
export interface BookingSuggestion {
  type: 'coffee' | 'dinner' | 'drinks' | 'activity' | 'custom';
  title: string;
  description: string;
  estimatedCost: number;
}

// Domain events
export const BOOKING_EVENTS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_STATUS_UPDATED: 'booking.status.updated',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_COMPLETED: 'booking.completed',
} as const;

export type BookingEvent = (typeof BOOKING_EVENTS)[keyof typeof BOOKING_EVENTS];
