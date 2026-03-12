'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import {
  MessageCircleIcon,
  XIcon,
  SendIcon,
  BotIcon,
  UserIcon,
  SparklesIcon,
  ShoppingBagIcon,
  Loader2Icon,
} from 'lucide-react'
import Link from 'next/link'

const AIShoppingAssistant = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/ai/chat' }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const suggestedQuestions = [
    'What are your best deals today?',
    'Help me find a gift under $50',
    'Show me top-rated products',
    'What categories do you have?',
  ]

  // Parse product links in text
  const parseMessage = (text) => {
    const productLinkRegex = /\/product\/([a-zA-Z0-9_-]+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = productLinkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
      }
      parts.push({ type: 'link', content: match[0], productId: match[1] })
      lastIndex = match.index + match[0].length
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) })
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }]
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-slate-800 hover:bg-slate-900 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="AI Shopping Assistant"
      >
        {isOpen ? (
          <XIcon size={24} />
        ) : (
          <div className="relative">
            <MessageCircleIcon size={24} />
            <SparklesIcon
              size={12}
              className="absolute -top-1 -right-1 text-amber-400"
            />
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="bg-slate-800 text-white p-4 flex items-center gap-3">
            <div className="relative">
              <BotIcon size={28} />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800" />
            </div>
            <div>
              <h3 className="font-semibold">AI Shopping Assistant</h3>
              <p className="text-xs text-slate-300">
                Powered by AI - Here to help you shop
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 min-h-64 bg-slate-50">
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBagIcon size={28} className="text-slate-600" />
                </div>
                <h4 className="font-medium text-slate-800 mb-2">
                  Welcome to GoCart AI
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  I can help you find products, compare items, and get great
                  deals!
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInput(question)
                        sendMessage({ text: question })
                        setInput('')
                      }}
                      className="block w-full text-left text-sm px-3 py-2 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 transition"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <BotIcon size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-slate-800 text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                    }`}
                  >
                    {message.parts.map((part, partIndex) => {
                      if (part.type === 'text') {
                        const parsed = parseMessage(part.text)
                        return (
                          <span key={partIndex} className="text-sm whitespace-pre-wrap">
                            {parsed.map((p, i) =>
                              p.type === 'link' ? (
                                <Link
                                  key={i}
                                  href={p.content}
                                  className="text-blue-500 hover:underline font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                  View Product
                                </Link>
                              ) : (
                                <span key={i}>{p.content}</span>
                              )
                            )}
                          </span>
                        )
                      }
                      if (part.type === 'tool-invocation') {
                        return (
                          <span
                            key={partIndex}
                            className="text-xs text-slate-400 italic"
                          >
                            Searching products...
                          </span>
                        )
                      }
                      return null
                    })}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
                      <UserIcon size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
                  <BotIcon size={16} className="text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2">
                  <Loader2Icon size={16} className="animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about products..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white p-2 rounded-full transition"
              >
                <SendIcon size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default AIShoppingAssistant
