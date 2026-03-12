"use client";
import Title from "@/components/Title";
import { assets } from "@/assets/assets";
import { CheckCircle2, Users, Truck, ShieldCheck, Heart } from "lucide-react";
import Image from "next/image";

export default function AboutPage() {
  const features = [
    {
      icon: Users,
      title: "Customer First",
      description:
        "We prioritize your satisfaction with personalized service and support.",
      accent: "#22c55e",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description:
        "Quick and reliable shipping to get your products to you on time.",
      accent: "#3b82f6",
    },
    {
      icon: ShieldCheck,
      title: "Quality Assured",
      description:
        "Every product is carefully vetted to meet our high standards.",
      accent: "#f59e0b",
    },
    {
      icon: Heart,
      title: "Passion for Tech",
      description: "We love technology and bring you the latest innovations.",
      accent: "#ec4899",
    },
  ];

  const stats = [
    { number: "10K+", label: "Happy Customers" },
    { number: "500+", label: "Products" },
    { number: "50+", label: "Trusted Sellers" },
    { number: "98%", label: "Satisfaction Rate" },
  ];

  const values = [
    "Delivering excellence in every product we sell",
    "Building trust through transparency and quality",
    "Supporting innovation and emerging technology",
    "Creating a seamless shopping experience",
    "Empowering sellers to grow their business",
  ];

  return (
    <div className="mx-6">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto my-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center bg-linear-to-br from-green-50 to-blue-50 rounded-3xl p-8 sm:p-16">
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl font-semibold text-slate-800 mb-4">
              About <span className="text-green-600">eazy</span>cart
              <span className="text-green-600 text-5xl leading-0">.</span>
            </h1>
            <p className="text-slate-600 text-lg mb-6">
              Your trusted marketplace for cutting-edge gadgets and electronics.
              We connect passionate sellers with tech-savvy customers.
            </p>
            <p className="text-slate-600">
              At eazycart, we believe technology should be accessible to
              everyone. Whether you're looking for the latest smartphones,
              smartwatches, audio devices, or innovative accessories, we bring
              you a curated selection of quality products from verified sellers
              across the globe.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src={assets.hero_product_img}
              alt="About EazyCart"
              className="w-full max-w-md"
            />
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto my-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <h3 className="text-4xl font-bold text-green-600">
                {stat.number}
              </h3>
              <p className="text-slate-600 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-6xl mx-auto my-20">
        <Title
          visibleButton={false}
          title="Our Mission"
          description="Revolutionizing the way people discover and purchase technology products online."
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative h-52 px-6 flex flex-col items-center justify-center text-center border rounded-lg group hover:shadow-lg transition-all"
              style={{
                backgroundColor: feature.accent + "10",
                borderColor: feature.accent + "30",
              }}
            >
              <div
                className="absolute -top-5 text-white size-12 flex items-center justify-center rounded-md group-hover:scale-110 transition"
                style={{ backgroundColor: feature.accent }}
              >
                <feature.icon size={24} />
              </div>
              <h3 className="text-slate-800 font-medium mt-4">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-600 mt-3">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Our Values Section */}
      <div className="max-w-6xl mx-auto my-20">
        <Title
          visibleButton={false}
          title="What We Stand For"
          description="Our core values guide everything we do at eazycart."
        />

        <div className="mt-16 bg-white rounded-2xl shadow p-8 sm:p-12">
          <div className="space-y-4">
            {values.map((value, index) => (
              <div key={index} className="flex items-start gap-4">
                <CheckCircle2
                  className="text-green-600 mt-1 shrink-0"
                  size={24}
                />
                <p className="text-slate-700 text-lg">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="max-w-6xl mx-auto my-20">
        <div className="bg-linear-to-r from-slate-800 to-slate-700 rounded-3xl p-8 sm:p-16 text-white">
          <h2 className="text-3xl sm:text-4xl font-semibold mb-6">Our Story</h2>
          <div className="space-y-4 text-slate-200">
            <p>
              Founded with a vision to democratize access to cutting-edge
              technology, eazycart started as a small marketplace connecting
              tech enthusiasts with quality gadgets.
            </p>
            <p>
              Today, we've grown into a thriving community of sellers and
              customers who share our passion for innovation. We've facilitated
              thousands of transactions, helped countless sellers build their
              businesses, and brought joy to tech lovers worldwide.
            </p>
            <p>
              As we continue to grow, our commitment remains the same: providing
              a trustworthy platform where quality meets affordability, and
              where every purchase is backed by our dedication to customer
              satisfaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
