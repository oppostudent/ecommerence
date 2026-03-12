'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  SparklesIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  StarIcon,
  Loader2Icon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react'

const AIReviewSummary = ({ productId }) => {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true)
        const { data } = await axios.post('/api/ai/review-summary', { productId })
        setSummary(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchSummary()
    }
  }, [productId])

  if (error || (!loading && !summary)) return null
  if (loading) {
    return (
      <div className="my-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
        <div className="flex items-center gap-2">
          <Loader2Icon size={18} className="animate-spin text-slate-400" />
          <span className="text-slate-500 text-sm">
            AI is analyzing reviews...
          </span>
        </div>
      </div>
    )
  }

  if (summary.totalReviews === 0) return null

  const sentimentColors = {
    positive: 'bg-green-100 text-green-700 border-green-200',
    mixed: 'bg-amber-100 text-amber-700 border-amber-200',
    negative: 'bg-red-100 text-red-700 border-red-200',
  }

  return (
    <div className="my-8 p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon size={18} className="text-amber-500" />
          <h3 className="font-semibold text-slate-800">AI Review Summary</h3>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            AI Powered
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array(5)
              .fill('')
              .map((_, index) => (
                <StarIcon
                  key={index}
                  size={14}
                  className="text-transparent"
                  fill={
                    parseFloat(summary.averageRating) >= index + 1
                      ? '#00C950'
                      : '#D1D5DB'
                  }
                />
              ))}
            <span className="text-sm font-medium text-slate-600 ml-1">
              {summary.averageRating}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            ({summary.totalReviews} reviews)
          </span>
        </div>
      </div>

      {/* Summary Text */}
      <p className="text-slate-600 mb-4">{summary.summary}</p>

      {/* Sentiment Badge */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`text-xs px-3 py-1 rounded-full border ${
            sentimentColors[summary.sentiment]
          }`}
        >
          {summary.sentiment === 'positive' && 'Overall Positive'}
          {summary.sentiment === 'mixed' && 'Mixed Reviews'}
          {summary.sentiment === 'negative' && 'Some Concerns'}
        </span>
      </div>

      {/* Expandable Section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
      >
        {expanded ? 'Show Less' : 'Show Details'}
        {expanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
      </button>

      {expanded && (
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          {/* Pros */}
          {summary.pros && summary.pros.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsUpIcon size={16} className="text-green-600" />
                <h4 className="font-medium text-green-800">What People Love</h4>
              </div>
              <ul className="space-y-2">
                {summary.pros.map((pro, index) => (
                  <li
                    key={index}
                    className="text-sm text-green-700 flex items-start gap-2"
                  >
                    <span className="text-green-400 mt-1">+</span>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {summary.cons && summary.cons.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsDownIcon size={16} className="text-red-600" />
                <h4 className="font-medium text-red-800">Room for Improvement</h4>
              </div>
              <ul className="space-y-2">
                {summary.cons.map((con, index) => (
                  <li
                    key={index}
                    className="text-sm text-red-700 flex items-start gap-2"
                  >
                    <span className="text-red-400 mt-1">-</span>
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Buyer Recommendation */}
      {summary.buyerRecommendation && (
        <div className="mt-4 p-3 bg-slate-800 rounded-lg">
          <p className="text-sm text-white flex items-start gap-2">
            <SparklesIcon size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>AI Recommendation:</strong> {summary.buyerRecommendation}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default AIReviewSummary
