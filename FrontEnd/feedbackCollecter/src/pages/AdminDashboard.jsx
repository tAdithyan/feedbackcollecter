import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/axios';
function AdminDashboard() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');


useEffect(() => {
  const admin = localStorage.getItem('admin');
  if (!admin) {
    window.location.href = '/adminlogin';
  }
}, []);


  const fetchReviews = async () => {
    try {
      const response = await api.get('/feedback/');
      console.log('API Response:', response.data);
      
      const transformedReviews = response.data.map(review => ({
        id: review.id,
        user: review.user?.username || `User ${review.user_id}`, 
        email: review.user?.email || `user${review.user_id}@example.com`,
        rating: review.rating,
        comment: review.comment || 'No comment',
        timestamp: review.created_at,
        sentiment: review.emotion 
      }));
      
      setReviews(transformedReviews);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

 

  const calculateStats = () => {
    const total = reviews.length;
    
    // Define emotion categories
    const positiveEmotions = ['happiness', 'fun', 'relief', 'enthusiasm', 'love'];
    const negativeEmotions = ['anger', 'hate', 'worry', 'sadness'];
    
    const positive = reviews.filter(r => {
      if (!r.sentiment) return false;
      return positiveEmotions.includes(r.sentiment.toLowerCase());
    }).length;
    
    const negative = reviews.filter(r => {
      if (!r.sentiment) return false;
      return negativeEmotions.includes(r.sentiment.toLowerCase());
    }).length;
    
    const neutral = reviews.filter(r => r.sentiment && r.sentiment.toLowerCase() === 'neutral').length;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / total || 0;
    
    return {
      total,
      positive,
      negative,
      neutral,
      avgRating: avgRating.toFixed(1),
      positivePercentage: total > 0 ? ((positive / total) * 100).toFixed(1) : 0,
      negativePercentage: total > 0 ? ((negative / total) * 100).toFixed(1) : 0,
      neutralPercentage: total > 0 ? ((neutral / total) * 100).toFixed(1) : 0
    };
  };

  const generateChartData = () => {
    const emotionColors = {
      'happiness': '#10b981',    
      'fun': '#22c55e',          
      'relief': '#84cc16',       
      'enthusiasm': '#eab308',   
      'love': '#f97316',        
      'anger': '#ef4444',      
      'hate': '#dc2626',        
      'worry': '#f59e0b',      
      'sadness': '#8b5cf6',     
      'neutral': '#6b7280'      
    };

    const emotionCounts = {};
    
    Object.keys(emotionColors).forEach(emotion => {
      emotionCounts[emotion] = 0;
    });

    reviews.forEach(review => {
      if (review.sentiment) {
        const emotion = review.sentiment.toLowerCase();
        if (emotionCounts.hasOwnProperty(emotion)) {
          emotionCounts[emotion]++;
        }
      }
    });

    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      count: count,
      color: emotionColors[emotion]
    }));
  };


  const filteredReviews = reviews.filter(review => {
    let matchesFilter = false;
    
    if (selectedFilter === 'all') {
      matchesFilter = true;
    } else if (selectedFilter === 'positive') {
      const positiveEmotions = ['happiness', 'fun', 'relief', 'enthusiasm', 'love'];
      matchesFilter = review.sentiment && positiveEmotions.includes(review.sentiment.toLowerCase());
    } else if (selectedFilter === 'negative') {
      const negativeEmotions = ['anger', 'hate', 'worry', 'sadness'];
      matchesFilter = review.sentiment && negativeEmotions.includes(review.sentiment.toLowerCase());
    } else {
      matchesFilter = review.sentiment && review.sentiment.toLowerCase() === selectedFilter;
    }
    
    const matchesSearch = review.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = calculateStats();
  const chartData = generateChartData();

  const getSentimentColor = (sentiment) => {
    if (!sentiment) return 'text-gray-600 bg-gray-100';
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'hate': return 'text-red-600 bg-red-100';
      case 'neutral': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-base sm:text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mx-auto bg-gradient-to-br from-red-50 via-white to-orange-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem('admin');
                  window.location.href = '/adminlogin';
                }}
                className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-300 text-sm sm:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Total Reviews</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Average Rating</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{stats.avgRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Positive Reviews</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.positive}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Negative Reviews</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.negative}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm">Neutral Reviews</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{stats.neutral}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Emotion Distribution</h2>
          <div className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="emotion" 
                  stroke="#666"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={10}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} reviews`,
                    props.payload.emotion
                  ]}
                  labelFormatter={(label) => `Emotion: ${label}`}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="url(#barGradient)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors duration-300 text-xs sm:text-sm ${
                  selectedFilter === 'all' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('positive')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors duration-300 text-xs sm:text-sm ${
                  selectedFilter === 'positive' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Positive
              </button>
              <button
                onClick={() => setSelectedFilter('neutral')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors duration-300 text-xs sm:text-sm ${
                  selectedFilter === 'neutral' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Neutral
              </button>
              <button
                onClick={() => setSelectedFilter('negative')}
                className={`px-3 sm:px-4 py-2 rounded-lg transition-colors duration-300 text-xs sm:text-sm ${
                  selectedFilter === 'negative' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Negative
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">User Reviews</h2>
          
          {filteredReviews.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg">No reviews found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-4 gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                        {review.user.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{review.user}</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">{review.email}</p>
                        <p className="text-gray-400 text-xs">
                          {new Date(review.timestamp).toLocaleDateString()} at{' '}
                          {new Date(review.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex">
                        {getRatingStars(review.rating)}
                      </div>
                      <span className="text-gray-500 text-xs sm:text-sm">({review.rating}/5)</span>
                    </div>
                  </div>
                  
                  <div className="mb-3 sm:mb-4">
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{review.comment}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-gray-500">Sentiment:</span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getSentimentColor(review.sentiment)}`}>
                         {review.sentiment ? review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
