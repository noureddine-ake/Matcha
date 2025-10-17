"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Check, Heart, UserIcon, MessageSquare, Tag, Camera } from "lucide-react"
import Image from "next/image"
import api from "@/lib/api"

type Gender = "male" | "female" | "non-binary" | "other"
type SexualPreference = "men" | "women" | "both"

interface ProfileData {
  gender: Gender | ""
  sexualPreference: SexualPreference | ""
  biography: string
  interests: string[]
  photos: File[]
  profilePhotoIndex: number
}

const POPULAR_INTERESTS = [
  "#vegan",
  "#geek",
  "#piercing",
  "#fitness",
  "#travel",
  "#music",
  "#art",
  "#cooking",
  "#gaming",
  "#photography",
  "#yoga",
  "#coffee",
]

export default function ProfileCompletePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [profileData, setProfileData] = useState<ProfileData>({
    gender: "",
    sexualPreference: "",
    biography: "",
    interests: [],
    photos: [],
    profilePhotoIndex: 0,
  })
  const [newInterest, setNewInterest] = useState("")
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const totalSteps = 5

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenderSelect = (gender: Gender) => {
    setProfileData({ ...profileData, gender })
  }

  const handlePreferenceSelect = (preference: SexualPreference) => {
    setProfileData({ ...profileData, sexualPreference: preference })
  }

  const handleAddInterest = (interest: string) => {
    const formattedInterest = interest.startsWith("#") ? interest : `#${interest}`
    if (formattedInterest.length > 1 && !profileData.interests.includes(formattedInterest)) {
      setProfileData({
        ...profileData,
        interests: [...profileData.interests, formattedInterest],
      })
      setNewInterest("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setProfileData({
      ...profileData,
      interests: profileData.interests.filter((i) => i !== interest),
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = 5 - profileData.photos.length

    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more photo(s)`)
      return
    }

    const newPhotos = [...profileData.photos, ...files]
    setProfileData({ ...profileData, photos: newPhotos })

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemovePhoto = (index: number) => {
    const newPhotos = profileData.photos.filter((_, i) => i !== index)
    const newPreviews = photoPreviews.filter((_, i) => i !== index)
    setProfileData({
      ...profileData,
      photos: newPhotos,
      profilePhotoIndex: profileData.profilePhotoIndex === index ? 0 : profileData.profilePhotoIndex,
    })
    setPhotoPreviews(newPreviews)
  }

  const handleSetProfilePhoto = (index: number) => {
    setProfileData({ ...profileData, profilePhotoIndex: index })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("gender", profileData.gender)
      formData.append("sexualPreference", profileData.sexualPreference)
      formData.append("biography", profileData.biography)
      formData.append("interests", JSON.stringify(profileData.interests))
      formData.append("profilePhotoIndex", profileData.profilePhotoIndex.toString())

      profileData.photos.forEach((photo, index) => {
        formData.append(`photo${index}`, photo)
      })

      const response = await api.post("/profile/complete",formData,)
      
      console.log(response);

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profileData.gender !== ""
      case 2:
        return profileData.sexualPreference !== ""
      case 3:
        return profileData.biography.trim().length >= 50
      case 4:
        return profileData.interests.length >= 3
      case 5:
        return profileData.photos.length >= 1
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-30"></div>
            <div className="relative bg-gradient-to-br from-white to-gray-100 rounded-2xl p-6 shadow-2xl">
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-24 h-24 flex items-center justify-center text-gray-500 text-xs">
                Logo
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-full h-2 mx-1 rounded-full transition-all duration-300 ${
                  step <= currentStep ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <p className="text-white text-center text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
          <AnimatePresence mode="wait">
            {/* Step 1: Gender */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <UserIcon className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">{"What's your gender ?"}</h2>
                  <p className="text-purple-200">Help us personalize your experience</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(["male", "female", "non-binary", "other"] as Gender[]).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => handleGenderSelect(gender)}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                        profileData.gender === gender
                          ? "border-purple-400 bg-purple-400/20 shadow-lg shadow-purple-500/20"
                          : "border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-white text-lg capitalize font-medium">{gender}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Sexual Preference */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <Heart className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Who are you interested in?</h2>
                  <p className="text-purple-200">Let us know your preferences</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {(["men", "women", "both"] as SexualPreference[]).map((preference) => (
                    <button
                      key={preference}
                      onClick={() => handlePreferenceSelect(preference)}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                        profileData.sexualPreference === preference
                          ? "border-purple-400 bg-purple-400/20 shadow-lg shadow-purple-500/20"
                          : "border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-white text-lg capitalize font-medium">{preference}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Biography */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <MessageSquare className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Tell us about yourself</h2>
                  <p className="text-purple-200">Share what makes you unique</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biography" className="text-white text-base font-medium">
                    Biography (minimum 50 characters)
                  </Label>
                  <Textarea
                    id="biography"
                    placeholder="Share your story, interests, what makes you unique..."
                    value={profileData.biography}
                    onChange={(e) => setProfileData({ ...profileData, biography: e.target.value })}
                    className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl p-4 focus-visible:ring-2 focus-visible:ring-purple-400 text-lg"
                  />
                  <p className={`text-sm ${profileData.biography.length >= 50 ? "text-green-300" : "text-white/60"}`}>
                    {profileData.biography.length}/50 characters minimum
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 4: Interests */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <Tag className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">What are your interests?</h2>
                  <p className="text-purple-200">Select at least 3 interests</p>
                </div>

                {/* Selected Interests */}
                {profileData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profileData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-400/20 border border-purple-400 text-white rounded-full font-medium"
                      >
                        {interest}
                        <button
                          onClick={() => handleRemoveInterest(interest)}
                          className="hover:text-red-300 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Custom Interest */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <Input
                      placeholder="Add custom interest (e.g., vegan, geek)"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddInterest(newInterest)
                        }
                      }}
                      className="h-12 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-2xl pl-12 pr-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleAddInterest(newInterest)}
                    className="h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl px-6"
                  >
                    Add
                  </Button>
                </div>

                {/* Popular Interests */}
                <div>
                  <p className="text-white/80 text-sm mb-3 font-medium">Popular interests:</p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        onClick={() => handleAddInterest(interest)}
                        disabled={profileData.interests.includes(interest)}
                        className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                          profileData.interests.includes(interest)
                            ? "border-purple-400 bg-purple-400/20 text-white/50 cursor-not-allowed"
                            : "border-white/20 bg-white/5 text-white hover:border-purple-400 hover:bg-purple-400/10"
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Photos */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <Camera className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Add your photos</h2>
                  <p className="text-purple-200">Upload up to 5 photos. Click to set profile picture.</p>
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square group">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className={`w-full h-full object-cover rounded-2xl cursor-pointer transition-all duration-200 ${
                          profileData.profilePhotoIndex === index
                            ? "ring-4 ring-purple-400 shadow-lg shadow-purple-500/50"
                            : "hover:ring-2 hover:ring-purple-400/50"
                        }`}
                        onClick={() => handleSetProfilePhoto(index)}
                        width={200}
                        height={200}
                      />
                      {profileData.profilePhotoIndex === index && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <Check className="w-3 h-3" />
                          Profile
                        </div>
                      )}
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  {profileData.photos.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all duration-200 group">
                      <Upload className="w-8 h-8 text-white/60 group-hover:text-purple-300 mb-2 transition-colors" />
                      <span className="text-white/60 group-hover:text-white text-sm font-medium transition-colors">
                        Upload Photo
                      </span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <p className="text-white/60 text-sm text-center font-medium">
                  {profileData.photos.length}/5 photos uploaded
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 text-red-300 text-sm text-center bg-red-500/20 py-3 px-4 rounded-2xl"
            >
              {error}
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white rounded-2xl font-semibold"
              >
                Back
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl disabled:opacity-50 font-semibold shadow-lg"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 h-12 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl disabled:opacity-50 font-semibold shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Completing...
                  </div>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
