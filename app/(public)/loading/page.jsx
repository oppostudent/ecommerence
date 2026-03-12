'use client'

import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { clearCart, fetchCart } from "@/lib/features/cart/cartSlice"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useDispatch } from "react-redux"

export default function LoadingPage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const { user, isLoaded } = useUser()
    const dispatch = useDispatch()

    useEffect(() => {
        const handleRedirect = async () => {
            const params = new URLSearchParams(window.location.search)
            const url = params.get('nextUrl')
            const sessionId = params.get('session_id')

            if (sessionId && user) {
                try {
                    const token = await getToken()
                    const { data } = await axios.post('/api/orders/confirm-stripe', {
                        sessionId,
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    })

                    if (data?.confirmed) {
                        await axios.post('/api/cart', {
                            cart: {},
                        }, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        })
                    }

                    dispatch(clearCart())
                    dispatch(fetchCart({ getToken }))
                } catch (error) {
                    console.error(error)
                }
            }

            if (url) {
                setTimeout(() => {
                    router.push(url)
                }, 3000)
            }
        }

        if (isLoaded) {
            if (user) {
                handleRedirect()
            } else {
                router.push('/')
            }
        }
    }, [router, getToken, user, isLoaded, dispatch])

    return <Loading />
}
