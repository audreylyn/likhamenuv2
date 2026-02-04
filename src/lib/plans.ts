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
        price: 1999,
        sections: ["hero", "about", "menu", "payment", "contact", "footer"],
    },
    {
        id: "standard",
        name: "Standard Plan",
        price: 2999,
        sections: [
            "hero",
            "about",
            "menu",
            "payment",
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
        price: 4999,
        sections: [
            "hero",
            "about",
            "menu",
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
    },
];
