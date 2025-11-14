/**
 * Official Next.js 14 Server Actions
 * Type-safe server-side mutations with automatic revalidation
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { profileSchema, messageSchema } from '@/lib/validation'
import type { z } from 'zod'

// Type-safe action response
type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Update user profile
 */
export async function updateProfile(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
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

    const validated = messageSchema.parse(data)

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

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { success: false, error: 'Invalid file type' }
    }

    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File too large (max 10MB)' }
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
