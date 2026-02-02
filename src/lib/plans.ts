export interface ServicePlan {
    id: string;
    name: string;
    price: number;
    sections: string[];
}

export const PLANS: ServicePlan[] = [
    {
        id: "basic",
        name: "Basic Plan",
        price: 999,
        sections: ["hero", "about", "menu", "contact", "footer"],
    },
    {
        id: "standard",
        name: "Standard Plan",
        price: 1499,
        sections: [
            "hero",
            "about",
            "menu",
            "contact",
            "footer",
            "testimonials",
            "faq",
            "instagramFeed",
            "whyChooseUs",
        ],
    },
    {
        id: "premium",
        name: "Premium Plan",
        price: 2499,
        sections: [
            "hero",
            "about",
            "menu",
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
    },
];
