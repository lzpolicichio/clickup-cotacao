// ClickUp Pricing Configuration
// This file contains all pricing parameters for easy maintenance

const CONFIG = {
    // License types and base prices (USD per user/month)
    licenses: {
        unlimited: {
            id: 'unlimited',
            name: 'Unlimited',
            basePrice: 8,
            description: 'Equipes pequenas e médias'
        },
        business: {
            id: 'business',
            name: 'Business',
            basePrice: 12,
            description: 'Equipes em crescimento'
        },
        businessPlus: {
            id: 'businessPlus',
            name: 'Business Plus',
            basePrice: 19,
            description: 'Equipes avançadas com recursos premium'
        },
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            basePrice: 35,
            description: 'Grandes organizações'
        }
    },
    
    // Contract duration multipliers and discounts
    contractDurations: {
        annual1: {
            id: 'annual1',
            name: '1 Ano',
            multiplier: 1.0,
            months: 12,
            discount: 0
        },
        annual2: {
            id: 'annual2',
            name: '2 Anos',
            multiplier: 0.90,
            months: 24,
            discount: 10
        },
        annual3: {
            id: 'annual3',
            name: '3 Anos',
            multiplier: 0.80,
            months: 36,
            discount: 20
        }
    },
    
    // Add-ons pricing (USD per user/month)
    addons: {
        brainAI: {
            id: 'brainAI',
            name: 'Brain AI',
            pricePerUser: 5,
            description: 'Assistente inteligente com IA para automação'
        },
        notekerAI: {
            id: 'notekerAI',
            name: 'Noteker AI',
            pricePerUser: 3,
            description: 'Transcrição e anotações automáticas'
        }
    },
    
    // Quantity-based automatic discounts
    quantityDiscounts: [
        { min: 1, max: 10, discount: 0 },
        { min: 11, max: 25, discount: 5 },
        { min: 26, max: 50, discount: 10 },
        { min: 51, max: 100, discount: 15 },
        { min: 101, max: Infinity, discount: 20 }
    ],
    
    // Currency settings
    currency: {
        code: 'USD',
        symbol: '$',
        locale: 'en-US'
    },
    
    // Business settings
    company: {
        name: 'Volari',
        tagline: 'Revenda Autorizada ClickUp'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
