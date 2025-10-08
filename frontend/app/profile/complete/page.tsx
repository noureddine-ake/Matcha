"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Upload, Check } from "lucide-react"
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
      console.log("formData :", formData);
      const response = await api.post("/profile/complete", formData, {
        headers: {
          "content-Type": "multipart/form-data"
        }
      })
      console.log(response);
      // router.push("/dashboard")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient p-4">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <Image src="/Logo.png" width={150} height={150} alt="logo" />
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-full h-2 mx-1 rounded-full transition-all duration-300 ${
                  step <= currentStep ? "bg-purple-400" : "bg-white/20"
                }`}
              />
            ))}
          </div>
          <p className="text-white text-center text-sm">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
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
                <h2 className="text-3xl font-bold text-white mb-6">{"What's your gender?"}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(["male", "female", "non-binary", "other"] as Gender[]).map((gender) => (
                    <button
                      key={gender}
                      onClick={() => handleGenderSelect(gender)}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                        profileData.gender === gender
                          ? "border-purple-400 bg-purple-400/20"
                          : "border-white/20 bg-white/5 hover:border-purple-400/50"
                      }`}
                    >
                      <span className="text-white text-lg capitalize">{gender}</span>
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
                <h2 className="text-3xl font-bold text-white mb-6">Who are you interested in?</h2>
                <div className="grid grid-cols-1 gap-4">
                  {(["men", "women", "both"] as SexualPreference[]).map((preference) => (
                    <button
                      key={preference}
                      onClick={() => handlePreferenceSelect(preference)}
                      className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                        profileData.sexualPreference === preference
                          ? "border-purple-400 bg-purple-400/20"
                          : "border-white/20 bg-white/5 hover:border-purple-400/50"
                      }`}
                    >
                      <span className="text-white text-lg capitalize">{preference}</span>
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
                <h2 className="text-3xl font-bold text-white mb-6">Tell us about yourself</h2>
                <div className="space-y-2">
                  <Label htmlFor="biography" className="text-white text-base">
                    Biography (minimum 50 characters)
                  </Label>
                  <Textarea
                    id="biography"
                    placeholder="Share your story, interests, what makes you unique..."
                    value={profileData.biography}
                    onChange={(e) => setProfileData({ ...profileData, biography: e.target.value })}
                    className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-2xl p-4 focus-visible:ring-2 focus-visible:ring-purple-400"
                  />
                  <p className="text-white/60 text-sm">{profileData.biography.length}/50 characters minimum</p>
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
                <h2 className="text-3xl font-bold text-white mb-6">What are your interests?</h2>
                <p className="text-white/80 text-sm mb-4">Select at least 3 interests</p>

                {/* Selected Interests */}
                {profileData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {profileData.interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-400/20 border border-purple-400 text-white rounded-full"
                      >
                        {interest}
                        <button onClick={() => handleRemoveInterest(interest)} className="hover:text-red-300">
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Custom Interest */}
                <div className="flex gap-2">
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-full px-6 focus-visible:ring-2 focus-visible:ring-purple-400"
                  />
                  <Button
                    type="button"
                    onClick={() => handleAddInterest(newInterest)}
                    className="bg-purple-400 hover:bg-purple-500 rounded-full px-6"
                  >
                    Add
                  </Button>
                </div>

                {/* Popular Interests */}
                <div>
                  <p className="text-white/80 text-sm mb-3">Popular interests:</p>
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
                <h2 className="text-3xl font-bold text-white mb-6">Add your photos</h2>
                <p className="text-white/80 text-sm mb-4">
                  Upload up to 5 photos. Click on a photo to set it as your profile picture.
                </p>

                {/* Photo Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square group">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt={`Photo ${index + 1}`}
                        className={`w-full h-full object-cover rounded-2xl cursor-pointer transition-all duration-200 ${
                          profileData.profilePhotoIndex === index
                            ? "ring-4 ring-purple-400"
                            : "hover:ring-2 hover:ring-purple-400/50"
                        }`}
                        onClick={() => handleSetProfilePhoto(index)}
                        width={150} height={150}
                      />
                      {profileData.profilePhotoIndex === index && (
                        <div className="absolute top-2 left-2 bg-purple-400 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Profile
                        </div>
                      )}
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  {profileData.photos.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-white/5 transition-all duration-200">
                      <Upload className="w-8 h-8 text-white/60 mb-2" />
                      <span className="text-white/60 text-sm">Upload Photo</span>
                      <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <p className="text-white/60 text-sm">{profileData.photos.length}/5 photos uploaded</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 text-red-300 text-sm text-center bg-red-500/20 py-2 px-4 rounded-full"
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
                className="flex-1 h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
              >
                Back
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-12 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-full disabled:opacity-50"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex-1 h-12 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 text-white rounded-full disabled:opacity-50"
              >
                {loading ? "Completing..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
