'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { SparklesIcon, StarIcon, Loader2Icon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

const AIRecommendations = ({ productId = null, title = 'AI Picks For You' }) => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useUser()

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true)
        const type = productId ? 'similar' : user ? 'personalized' : 'trending'
        const { data } = await axios.post('/api/ai/recommendations', {
          productId,
          userId: user?.id,
          type,
        })
        setRecommendations(data.recommendations || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [productId, user?.id])

  if (error) return null

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <SparklesIcon size={20} className="text-amber-500" />
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            AI Powered
          </span>
        </div>
        <Link
          href="/shop"
          className="text-sm text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
        >
          View All <ChevronRightIcon size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2Icon size={24} className="animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Finding perfect products...</span>
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommendations.map((product) => {
            const avgRating =
              product.rating.length > 0
                ? product.rating.reduce((acc, r) => acc + r.rating, 0) /
                  product.rating.length
                : 0

            return (
              <Link
                href={`/product/${product.id}`}
                key={product.id}
                className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-slate-50 h-40 flex items-center justify-center relative">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={120}
                    height={120}
                    className="max-h-32 w-auto group-hover:scale-110 transition-transform duration-300"
                  />
                  {product.mrp > product.price && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-medium text-slate-800 text-sm line-clamp-1">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {Array(5)
                      .fill('')
                      .map((_, index) => (
                        <StarIcon
                          key={index}
                          size={12}
                          className="text-transparent"
                          fill={avgRating >= index + 1 ? '#00C950' : '#D1D5DB'}
                        />
                      ))}
                    <span className="text-xs text-slate-400 ml-1">
                      ({product.rating.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-semibold text-slate-800">
                      {currency}{product.price}
                    </span>
                    {product.mrp > product.price && (
                      <span className="text-xs text-slate-400 line-through">
                        {currency}{product.mrp}
                      </span>
                    )}
                  </div>
                  {product.reason && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 italic">
                      {product.reason}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-400">
          No recommendations available
        </div>
      )}
    </div>
  )
}

export default AIRecommendations
