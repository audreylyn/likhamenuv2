export interface ServicePlan {
    id: string;
    name: string;
    price: number;
    sections: string[];
    productLimit: number | "unlimited";
    description: string;
}

export const PLANS: ServicePlan[] = [
    {
        id: "basic",
        name: "Basic Plan",
        price: 999,
        sections: ["hero", "catalogue", "footer"],
        productLimit: 12,
        description: "Ideal for marketing websites",
    },
    {
        id: "standard",
        name: "Standard Plan",
        price: 3499,
        sections: [
            "hero",
            "about",
            "menu",
            "packages",
            "featuredProducts",
            "testimonials",
            "footer",
        ],
        productLimit: 30,
        description: "Great for small businesses and catalogs",
    },
    {
        id: "premium",
        name: "Premium Plan",
        price: 7499,
        sections: [
            "hero",
            "about",
            "menu",
            "packages",
            "payment",
            "contact",
            "footer",
            "testimonials",
            "faq",
            "instagramFeed",
            "whyChooseUs",
            "team",
            "featuredProducts",
            "reservation",
            "specialOffers",
            "chatSupport",
        ],
        productLimit: "unlimited",
        description: "Full enterprise solution with automation",
    },
];
