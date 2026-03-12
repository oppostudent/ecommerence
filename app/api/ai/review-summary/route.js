import { generateText, Output } from 'ai'
import { z } from 'zod'
import prisma from '@/lib/prisma'

export const maxDuration = 30

export async function POST(req) {
  try {
    const { productId } = await req.json()

    if (!productId) {
      return Response.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Get product with all reviews
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        rating: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.rating.length === 0) {
      return Response.json({
        summary: 'No reviews yet for this product.',
        pros: [],
        cons: [],
        sentiment: 'neutral',
        averageRating: 0,
        totalReviews: 0,
      })
    }

    const reviews = product.rating.map((r) => ({
      rating: r.rating,
      review: r.review,
      reviewer: r.user.name,
    }))

    const result = await generateText({
      model: 'openai/gpt-5-mini',
      prompt: `Analyze these customer reviews for "${product.name}":

${reviews.map((r) => `[${r.rating}/5 stars by ${r.reviewer}]: "${r.review}"`).join('\n\n')}

Provide a concise summary of customer feedback.`,
      output: Output.object({
        schema: z.object({
          summary: z
            .string()
            .describe('2-3 sentence summary of overall customer sentiment'),
          pros: z
            .array(z.string())
            .describe('Top 3 positive points mentioned by customers'),
          cons: z
            .array(z.string())
            .describe(
              'Top 3 concerns or negatives mentioned (empty if none)'
            ),
          sentiment: z
            .enum(['positive', 'mixed', 'negative'])
            .describe('Overall sentiment'),
          buyerRecommendation: z
            .string()
            .describe('One line recommendation for potential buyers'),
        }),
      }),
    })

    const avgRating =
      reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length

    return Response.json({
      ...result.object,
      averageRating: avgRating.toFixed(1),
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error('Review summary error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
