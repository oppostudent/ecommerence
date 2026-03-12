import {
  consumeStream,
  convertToModelMessages,
  streamText,
  tool,
} from 'ai'
import { z } from 'zod'
import prisma from '@/lib/prisma'

export const maxDuration = 30

export async function POST(req) {
  const { messages } = await req.json()

  // Get all products for the AI assistant to reference
  const products = await prisma.product.findMany({
    include: {
      rating: true,
      store: {
        select: {
          name: true,
          username: true,
        },
      },
    },
    where: {
      inStock: true,
      store: {
        isActive: true,
      },
    },
  })

  // Calculate average ratings
  const productsWithRatings = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    mrp: product.mrp,
    discount: Math.round(((product.mrp - product.price) / product.mrp) * 100),
    averageRating:
      product.rating.length > 0
        ? (
            product.rating.reduce((acc, r) => acc + r.rating, 0) /
            product.rating.length
          ).toFixed(1)
        : 'No ratings',
    reviewCount: product.rating.length,
    storeName: product.store.name,
    storeUsername: product.store.username,
  }))

  const result = streamText({
    model: 'openai/gpt-5-mini',
    system: `You are GoCart's AI Shopping Assistant - a friendly and helpful e-commerce assistant.

Your capabilities:
1. Help users find products based on their needs, preferences, and budget
2. Compare products and give recommendations
3. Answer questions about products, pricing, and availability
4. Suggest alternatives if something isn't available
5. Help with gift ideas based on occasions or interests

Current product catalog:
${JSON.stringify(productsWithRatings, null, 2)}

Guidelines:
- Be conversational, friendly, and helpful
- When recommending products, always mention the product name, price, and discount if applicable
- Format product links as: /product/{productId}
- If asked about something not in the catalog, politely say it's not available but suggest similar items
- Don't make up products that don't exist in the catalog
- Keep responses concise but informative
- Use the discount percentage to highlight deals
- Consider ratings and reviews when making recommendations`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    tools: {
      searchProducts: tool({
        description: 'Search for products by name, category, or description',
        inputSchema: z.object({
          query: z.string().describe('Search query'),
          category: z.string().nullable().describe('Product category filter'),
          maxPrice: z.number().nullable().describe('Maximum price filter'),
        }),
        execute: async ({ query, category, maxPrice }) => {
          let filtered = productsWithRatings

          if (query) {
            const q = query.toLowerCase()
            filtered = filtered.filter(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q)
            )
          }

          if (category) {
            filtered = filtered.filter(
              (p) => p.category.toLowerCase() === category.toLowerCase()
            )
          }

          if (maxPrice) {
            filtered = filtered.filter((p) => p.price <= maxPrice)
          }

          return filtered.slice(0, 5)
        },
      }),
      getProductDetails: tool({
        description: 'Get detailed information about a specific product',
        inputSchema: z.object({
          productId: z.string().describe('Product ID'),
        }),
        execute: async ({ productId }) => {
          const product = productsWithRatings.find((p) => p.id === productId)
          return product || { error: 'Product not found' }
        },
      }),
    },
    maxSteps: 3,
  })

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}
