import { generateText, Output } from 'ai'
import { z } from 'zod'
import prisma from '@/lib/prisma'

export const maxDuration = 30

export async function POST(req) {
  try {
    const { query } = await req.json()

    if (!query) {
      return Response.json({ error: 'Search query required' }, { status: 400 })
    }

    // Get all products
    const allProducts = await prisma.product.findMany({
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

    const productsData = allProducts.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      mrp: product.mrp,
      averageRating:
        product.rating.length > 0
          ? product.rating.reduce((acc, r) => acc + r.rating, 0) /
            product.rating.length
          : 0,
      reviewCount: product.rating.length,
    }))

    const result = await generateText({
      model: 'openai/gpt-5-mini',
      prompt: `A user is searching for: "${query}"

This could be:
- A natural language query like "something for my mom's birthday under $50"
- A descriptive search like "comfortable running shoes"
- A use-case search like "best products for home office"
- A comparison request like "cheap alternatives to expensive headphones"

From this product catalog, find the most relevant products:

${JSON.stringify(productsData, null, 2)}

Understand the user's intent and match products accordingly. Consider:
- Direct product matches
- Category matches
- Use-case matches
- Price constraints mentioned
- Quality/rating preferences
- Gift-worthiness if it seems like a gift search`,
      output: Output.object({
        schema: z.object({
          interpretation: z
            .string()
            .describe('What the user is likely looking for'),
          products: z
            .array(
              z.object({
                id: z.string(),
                relevanceReason: z
                  .string()
                  .describe('Why this product matches the search'),
                matchScore: z
                  .number()
                  .min(1)
                  .max(10)
                  .describe('How well it matches 1-10'),
              })
            )
            .max(8),
          suggestions: z
            .array(z.string())
            .describe('Related search suggestions'),
        }),
      }),
    })

    // Get full product data for matching products
    const matchedProducts = result.object.products
      .sort((a, b) => b.matchScore - a.matchScore)
      .map((match) => {
        const product = allProducts.find((p) => p.id === match.id)
        if (!product) return null
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          images: product.images,
          category: product.category,
          rating: product.rating,
          relevanceReason: match.relevanceReason,
          matchScore: match.matchScore,
        }
      })
      .filter(Boolean)

    return Response.json({
      interpretation: result.object.interpretation,
      products: matchedProducts,
      suggestions: result.object.suggestions,
    })
  } catch (error) {
    console.error('Smart search error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
