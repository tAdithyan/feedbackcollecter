import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/axios'

function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing user data:', error)
      return null
    }
  }

  const user = getUserFromStorage()

  if (!user) {
    window.location.href = '/signin'
    return null 
  }

  const handleSignOut = () => {
    localStorage.removeItem('user')
    window.location.reload()
  }

  const handleStarClick = (starValue) => {
    setRating(starValue)
  }

  const handleStarHover = (starValue) => {
    setHoveredRating(starValue)
  }

  const handleStarLeave = () => {
    setHoveredRating(0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      alert('Please select a rating!')
      return
    }

    setIsSubmitting(true)
    
    try {
      const currentUser = getUserFromStorage()
      
      if (!currentUser) {
        alert('Please sign in to submit feedback!')
        setIsSubmitting(false)
        return
      }

      const payload = {
        user_id: currentUser.id,
        rating: rating,
        comment: comment || null
      }

      console.log('Submitting feedback:', payload)
      
      const response = await api.post('/feedback/', payload)
      console.log('API Response:', response.data)
      
      alert('Thank you for your feedback! 🎉')
      
      setRating(0)
      setComment('')
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error submitting feedback:', error)
      if (error.response?.status === 404) {
        alert('User not found. Please sign in again.')
      } else if (error.response?.status === 400) {
        alert('Invalid rating. Please select a rating between 1-5.')
      } else {
        alert('Failed to submit feedback. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setRating(0)
    setComment('')
    setHoveredRating(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
               
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Feedback Collector
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/adminlogin"
                    className="px-4 py-2   border rounded-lg cursor-pointer transition-colors duration-300 font-medium"
                  >
                    Admin Dashboard
                  </Link>
                  <div className="flex items-center space-x-3">
                   
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-2   rounded-lg cursor-pointer transition-colors duration-300 font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-4rem)]">
        <div className="text-center">
        <span className="text-gray-700">
                      Welcome, <span className="font-semibold text-blue-600">{user.username}</span>
                    </span>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Feedback Collector
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Share your experience with us
        </p>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
        >
          Give Feedback
        </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Rate Your Experience</h2>
              <p className="text-gray-600">How would you rate our service?</p>
            </div>

            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                  onMouseLeave={handleStarLeave}
                  className="focus:outline-none transition-transform duration-200 hover:scale-110"
                >
                  <svg
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    } transition-colors duration-200`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>

            <div className="text-center mb-6">
              <p className="text-lg font-medium text-gray-700">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments (Optional)
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                  placeholder="Tell us more about your experience..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home