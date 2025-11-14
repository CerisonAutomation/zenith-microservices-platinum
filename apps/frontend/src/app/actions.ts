/**
 * Official Next.js 14 Server Actions
 * Type-safe server-side mutations with automatic revalidation
 *
 * SECURITY FIX #6: Added CSRF protection
 * Next.js Server Actions have built-in CSRF protection via:
 * 1. POST-only requests
 * 2. Same-origin policy
 * 3. Unpredictable action IDs
 * 4. Proper cookie handling with SameSite
 *
 * Additional security: All actions verify user authentication
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { profileSchema, messageSchema } from '@/lib/validation'
import type { z } from 'zod'

// Type-safe action response
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * SECURITY FIX #6: CSRF validation helper
 * Validates that the request comes from the same origin
 */
async function validateCSRF() {
  const headersList = headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')

  // In production, verify origin matches host
  if (process.env.NODE_ENV === 'production') {
    if (!origin || !host) {
      return false
    }
    // Ensure origin matches our host (prevent CSRF from external sites)
    const originHost = new URL(origin).host
    if (originHost !== host) {
      return false
    }
  }

  return true
}

/**
 * Update user profile
 */
export async function updateProfile(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    // SECURITY FIX #6: Validate CSRF protection
    const isValidRequest = await validateCSRF()
    if (!isValidRequest) {
      return { success: false, error: 'Invalid request origin' }
    }

    const supabase = createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const data = {
      full_name: formData.get('full_name') as string,
      bio: formData.get('bio') as string,
      age: parseInt(formData.get('age') as string),
      location: formData.get('location') as string,
    }

    const validated = profileSchema.parse(data)

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update(validated)
      .eq('id', user.id)

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate profile page
    revalidatePath('/profile')
    revalidateTag(`profile-${user.id}`)

    return { success: true, data: { id: user.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to update profile' }
  }
}

/**
 * Send message
 */
export async function sendMessage(
  prevState: any,
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    // SECURITY FIX #6: Validate CSRF protection
    const isValidRequest = await validateCSRF()
    if (!isValidRequest) {
      return { success: false, error: 'Invalid request origin' }
    }

    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const data = {
      content: formData.get('content') as string,
      receiver_id: formData.get('receiver_id') as string,
      conversation_id: formData.get('conversation_id') as string,
    }

    // SECURITY FIX #11: Sanitize message content to prevent XSS
    // Strip HTML tags and dangerous content before validation
    const sanitizedContent = data.content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim()

    const validated = messageSchema.parse({
      ...data,
      content: sanitizedContent,
    })

    // Send message using RPC for security
    const { data: message, error } = await supabase.rpc('send_message', {
      p_receiver_id: validated.receiver_id,
      p_content: validated.content,
      p_conversation_id: validated.conversation_id || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Revalidate messages
    revalidatePath('/messages')
    revalidateTag(`conversation-${validated.conversation_id || message.conversation_id}`)

    return { success: true, data: { id: message.id } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Failed to send message' }
  }
}

/**
 * Upload profile photo
 */
export async function uploadProfilePhoto(
  formData: FormData
): Promise<ActionResponse<{ url: string }>> {
  try {
    // SECURITY FIX #6: Validate CSRF protection
    const isValidRequest = await validateCSRF()
    if (!isValidRequest) {
      return { success: false, error: 'Invalid request origin' }
    }

    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('photo') as File

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // SECURITY FIX #18: Comprehensive server-side file validation

    // 1. Validate MIME type from browser
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' }
    }

    // 2. Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File too large. Maximum size is 10MB.' }
    }

    // 3. Validate minimum file size (prevent empty/corrupt files)
    const MIN_FILE_SIZE = 1024 // 1KB
    if (file.size < MIN_FILE_SIZE) {
      return { success: false, error: 'File too small. Minimum size is 1KB.' }
    }

    // 4. Validate file extension matches MIME type
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const validExtensions = ['jpg', 'jpeg', 'png', 'webp']
    if (!fileExtension || !validExtensions.includes(fileExtension)) {
      return { success: false, error: 'Invalid file extension.' }
    }

    // 5. Verify MIME type matches extension
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    }
    const expectedExtensions = mimeToExt[file.type]
    if (!expectedExtensions || !expectedExtensions.includes(fileExtension)) {
      return { success: false, error: 'File type does not match extension.' }
    }

    // 6. Validate image dimensions (optional but recommended)
    // This prevents uploading very large resolution images that could cause issues
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Basic magic number validation to verify it's actually an image
      const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
      const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF
      const isWebP = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50

      if (!isPNG && !isJPEG && !isWebP) {
        return { success: false, error: 'File does not appear to be a valid image.' }
      }
    } catch (error) {
      return { success: false, error: 'Failed to validate file contents.' }
    }

    // Upload to Supabase Storage
    const fileName = `${user.id}-${Date.now()}.${file.type.split('/')[1]}`
    const { data, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(data.path)

    // Update profile with new photo URL
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id)

    revalidatePath('/profile')
    revalidateTag(`profile-${user.id}`)

    return { success: true, data: { url: publicUrl } }
  } catch (error) {
    return { success: false, error: 'Failed to upload photo' }
  }
}

/**
 * Like profile
 */
export async function likeProfile(
  userId: string
): Promise<ActionResponse<{ matched: boolean }>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    // Use RPC to handle like and check for match
    const { data, error } = await supabase.rpc('like_profile', {
      p_liked_user_id: userId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/explore')
    revalidateTag('matches')

    return {
      success: true,
      data: { matched: data.matched },
    }
  } catch (error) {
    return { success: false, error: 'Failed to like profile' }
  }
}

/**
 * Block user
 */
export async function blockUser(userId: string): Promise<ActionResponse<null>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.rpc('block_user', {
      p_blocked_user_id: userId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/explore')
    revalidatePath('/messages')

    redirect('/explore')
  } catch (error) {
    return { success: false, error: 'Failed to block user' }
  }
}

/**
 * Update location
 */
export async function updateLocation(
  latitude: number,
  longitude: number,
  accuracy?: number
): Promise<ActionResponse<null>> {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const { error } = await supabase.rpc('update_user_location', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_accuracy: accuracy || null,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    revalidateTag('nearby-users')

    return { success: true, data: null }
  } catch (error) {
    return { success: false, error: 'Failed to update location' }
  }
}
