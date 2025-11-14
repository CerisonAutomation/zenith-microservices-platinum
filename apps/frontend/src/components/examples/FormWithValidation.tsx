/**
 * Example Component: Form with Comprehensive Validation
 * Demonstrates best practices for form validation and error handling
 */

'use client'

import { useState } from 'react'
import { useFormValidation } from '@/hooks/use-form-validation'
import { profileSchema } from '@/lib/validation'
import { userService } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export function FormWithValidation() {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    age: '',
    gender: 'male' as const,
    interests: [] as string[],
    location: {
      city: '',
      country: '',
    },
    lookingFor: 'relationship' as const,
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validation = useFormValidation(profileSchema)

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Real-time validation for the changed field
    validation.validateField(field, value, formData)

    // Clear success/error messages
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Parse age to number
    const dataToValidate = {
      ...formData,
      age: parseInt(formData.age) || 0,
    }

    // Validate entire form
    const isValid = validation.validateAll(dataToValidate)

    if (!isValid) {
      setError('Please fix the errors in the form')
      return
    }

    // Submit form
    setLoading(true)
    try {
      await userService.updateProfile(dataToValidate)
      setSuccess(true)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (field: keyof typeof formData) => {
    return validation.errors[field]?.message
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
        <CardDescription>
          Update your profile information with real-time validation
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* Success message */}
          {success && (
            <Alert className="bg-green-950/30 border-green-500/30 text-green-300">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Profile updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your name"
              className={getFieldError('name') ? 'border-red-500' : ''}
            />
            {getFieldError('name') && (
              <p className="text-sm text-red-400">{getFieldError('name')}</p>
            )}
          </div>

          {/* Bio field */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself"
              maxLength={500}
              className={getFieldError('bio') ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-400">
              {formData.bio.length}/500 characters
            </p>
            {getFieldError('bio') && (
              <p className="text-sm text-red-400">{getFieldError('bio')}</p>
            )}
          </div>

          {/* Age field */}
          <div className="space-y-2">
            <Label htmlFor="age">
              Age <span className="text-red-500">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="Your age"
              min="18"
              max="100"
              className={getFieldError('age') ? 'border-red-500' : ''}
            />
            {getFieldError('age') && (
              <p className="text-sm text-red-400">{getFieldError('age')}</p>
            )}
          </div>

          {/* Location fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={formData.location.city}
                onChange={(e) =>
                  handleInputChange('location', {
                    ...formData.location,
                    city: e.target.value,
                  })
                }
                placeholder="Your city"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                value={formData.location.country}
                onChange={(e) =>
                  handleInputChange('location', {
                    ...formData.location,
                    country: e.target.value,
                  })
                }
                placeholder="Your country"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                bio: '',
                age: '',
                gender: 'male',
                interests: [],
                location: { city: '', country: '' },
                lookingFor: 'relationship',
              })
              validation.clearAllErrors()
              setError(null)
              setSuccess(false)
            }}
            disabled={loading}
          >
            Reset
          </Button>
          <Button type="submit" disabled={loading || validation.hasErrors}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
