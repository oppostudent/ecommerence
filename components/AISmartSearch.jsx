'use client'

import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import {
  SearchIcon,
  SparklesIcon,
  XIcon,
  Loader2Icon,
  StarIcon,
  TrendingUpIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const AISmartSearch = () => {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)
  const router = useRouter()

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5))
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const saveSearch = (searchQuery) => {
    const updated = [
      searchQuery,
      ...recentSearches.filter((s) => s !== searchQuery),
    ].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setIsOpen(true)
    saveSearch(searchQuery)

    try {
      const { data } = await axios.post('/api/ai/smart-search', {
        query: searchQuery,
      })
      setResults(data)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleSearch()
  }

  const handleProductClick = () => {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-slate-100 rounded-full overflow-hidden">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search with AI... try 'gift under $30' or 'best electronics'"
            className="w-full px-4 py-2.5 bg-transparent text-sm focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults(null)
              }}
              className="p-2 text-slate-400 hover:text-slate-600"
            >
              <XIcon size={16} />
            </button>
          )}
          <button
            type="submit"
            className="bg-slate-800 text-white p-2.5 m-1 rounded-full hover:bg-slate-900 transition flex items-center gap-1"
          >
            {loading ? (
              <Loader2Icon size={18} className="animate-spin" />
            ) : (
              <>
                <SparklesIcon size={14} />
                <SearchIcon size={16} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-[70vh] overflow-y-auto z-50">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2Icon
                size={24}
                className="animate-spin text-slate-400 mx-auto mb-2"
              />
              <p className="text-slate-500 text-sm">
                AI is finding the best matches...
              </p>
            </div>
          ) : results ? (
            <div className="p-4">
              {/* AI Interpretation */}
              {results.interpretation && (
                <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <SparklesIcon size={14} className="text-amber-500" />
                    <span className="text-slate-600">
                      {results.interpretation}
                    </span>
                  </div>
                </div>
              )}

              {/* Products */}
              {results.products && results.products.length > 0 ? (
                <>
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                    Matched Products ({results.products.length})
                  </h4>
                  <div className="space-y-2">
                    {results.products.slice(0, 6).map((product) => {
                      const avgRating =
                        product.rating.length > 0
                          ? product.rating.reduce((acc, r) => acc + r.rating, 0) /
                            product.rating.length
                          : 0

                      return (
                        <Link
                          key={product.id}
                          href={`/product/${product.id}`}
                          onClick={handleProductClick}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition"
                        >
                          <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="max-h-10 w-auto"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center">
                                {Array(5)
                                  .fill('')
                                  .map((_, i) => (
                                    <StarIcon
                                      key={i}
                                      size={10}
                                      className="text-transparent"
                                      fill={
                                        avgRating >= i + 1 ? '#00C950' : '#D1D5DB'
                                      }
                                    />
                                  ))}
                              </div>
                              <span className="text-xs text-slate-400">
                                Match: {product.matchScore}/10
                              </span>
                            </div>
                            {product.relevanceReason && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {product.relevanceReason}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-slate-800">
                              {currency}{product.price}
                            </p>
                            {product.mrp > product.price && (
                              <p className="text-xs text-red-500">
                                {Math.round(
                                  ((product.mrp - product.price) / product.mrp) *
                                    100
                                )}
                                % off
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  No products found for this search
                </div>
              )}

              {/* Related Suggestions */}
              {results.suggestions && results.suggestions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Related Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(suggestion)
                          handleSearch(suggestion)
                        }}
                        className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* View All */}
              <button
                onClick={() => {
                  router.push(`/shop?search=${encodeURIComponent(query)}`)
                  setIsOpen(false)
                }}
                className="w-full mt-4 py-2 text-center text-sm text-slate-600 hover:text-slate-800 border-t border-slate-100"
              >
                View all results for "{query}"
              </button>
            </div>
          ) : (
            <div className="p-4">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Recent Searches
                  </h4>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setQuery(search)
                          handleSearch(search)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        <SearchIcon size={14} className="text-slate-400" />
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending */}
              <div>
                <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <TrendingUpIcon size={12} />
                  Try Searching
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'best deals today',
                    'gift ideas under $50',
                    'top rated products',
                    'electronics',
                    'home essentials',
                  ].map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion)
                        handleSearch(suggestion)
                      }}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AISmartSearch
