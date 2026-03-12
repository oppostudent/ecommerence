'use client'
import BestSelling from "@/components/BestSelling";
import Hero from "@/components/Hero";
import Newsletter from "@/components/Newsletter";
import OurSpecs from "@/components/OurSpec";
import LatestProducts from "@/components/LatestProducts";
import AIRecommendations from "@/components/AIRecommendations";

export default function Home() {
    return (
        <div>
            <Hero />
            <LatestProducts />
            <div className="max-w-7xl mx-auto px-6">
                <AIRecommendations title="Recommended For You" />
            </div>
            <BestSelling />
            <OurSpecs />
            <Newsletter />
        </div>
    );
}
