import { generateText, Output } from 'ai'
import { z } from 'zod'
import prisma from '@/lib/prisma'

export const maxDuration = 30

export async function POST(req) {
  try {
    const { productId, userId, type = 'similar' } = await req.json()

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

    // Get user's order history if userId provided
    let userHistory = []
    if (userId) {
      const orders = await prisma.order.findMany({
        where: { userId },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      userHistory = orders.flatMap((order) =>
        order.orderItems.map((item) => ({
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
        }))
      )
    }

    // Get current product if productId provided
    let currentProduct = null
    if (productId) {
      currentProduct = allProducts.find((p) => p.id === productId)
    }

    // Prepare products data for AI
    const productsData = allProducts
      .filter((p) => p.id !== productId)
      .map((product) => ({
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

    let prompt = ''
    if (type === 'similar' && currentProduct) {
      prompt = `Based on this product that a user is viewing:
      
Product: ${currentProduct.name}
Category: ${currentProduct.category}
Description: ${currentProduct.description}
Price: $${currentProduct.price}

Find the 4 most similar or complementary products from this catalog that the user might also like.
Consider category, price range, and purpose/use case.`
    } else if (type === 'personalized' && userHistory.length > 0) {
      prompt = `Based on this user's purchase history:
      
${userHistory.map((h) => `- ${h.name} (${h.category}) - $${h.price}`).join('\n')}

Recommend 4 products they might be interested in based on their preferences.
Consider their preferred categories, price ranges, and buying patterns.`
    } else {
      prompt = `Recommend the 4 best products from this catalog based on:
- Highest ratings and most reviews
- Best value (discount percentage)
- Product quality indicators in the description`
    }

    const result = await generateText({
      model: 'openai/gpt-5-mini',
      prompt: `${prompt}

Available products:
${JSON.stringify(productsData, null, 2)}

Return ONLY the product IDs of your top 4 recommendations.`,
      output: Output.object({
        schema: z.object({
          recommendations: z
            .array(
              z.object({
                productId: z.string(),
                reason: z.string(),
              })
            )
            .max(4),
        }),
      }),
    })

    // Get full product data for recommendations
    const recommendedProducts = result.object.recommendations
      .map((rec) => {
        const product = allProducts.find((p) => p.id === rec.productId)
        if (!product) return null
        return {
          id: product.id,
          name: product.name,
          price: product.price,
          mrp: product.mrp,
          images: product.images,
          category: product.category,
          rating: product.rating,
          reason: rec.reason,
        }
      })
      .filter(Boolean)

    return Response.json({ recommendations: recommendedProducts })
  } catch (error) {
    console.error('Recommendations error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
