/**
 * Comprehensive Coupon Configuration for Lavpop Campaign System
 *
 * This file defines all available coupon codes for the self-service laundromat.
 * Customers enter these codes at the POS kiosk when paying for services.
 *
 * Naming Convention:
 * - VOLTE = "Volte" (come back) - Win-back campaigns, all services
 * - LAVA = "Lava" (wash) - Win-back campaigns, wash only
 * - SECA = "Seca" (dry) - Win-back campaigns, dry only
 * - BEM = "Bem-vindo" (welcome) - Welcome campaigns
 * - PROMO = Promotional campaigns, all services
 * - PSEC = Promotional campaigns, dry only
 * - SEQUE = "Seque" (dry) - Upsell campaigns for dry service
 *
 * Number suffix indicates discount percentage (e.g., VOLTE20 = 20% off)
 */

// Service type constants
export const SERVICE_TYPES = {
  WASH: 'wash',
  DRY: 'dry',
  BOTH: 'both'
};

// Campaign type constants
export const CAMPAIGN_TYPES = {
  WINBACK: 'winback',
  WELCOME: 'welcome',
  PROMO: 'promo',
  UPSELL: 'upsell'
};

// Available discount percentages by campaign type
export const DISCOUNT_OPTIONS = {
  [CAMPAIGN_TYPES.WINBACK]: [15, 20, 25, 30],
  [CAMPAIGN_TYPES.WELCOME]: [10, 15, 20],
  [CAMPAIGN_TYPES.PROMO]: [10, 15, 20, 25],
  [CAMPAIGN_TYPES.UPSELL]: [10, 15, 20]
};

// Service type labels for UI (Portuguese)
export const SERVICE_TYPE_LABELS = {
  [SERVICE_TYPES.BOTH]: 'Todos os Serviços',
  [SERVICE_TYPES.WASH]: 'Só Lavagem',
  [SERVICE_TYPES.DRY]: 'Só Secagem'
};

// Available service types by campaign type
export const SERVICE_OPTIONS = {
  [CAMPAIGN_TYPES.WINBACK]: [SERVICE_TYPES.BOTH, SERVICE_TYPES.WASH, SERVICE_TYPES.DRY],
  [CAMPAIGN_TYPES.WELCOME]: [SERVICE_TYPES.BOTH], // Welcome always applies to all services
  [CAMPAIGN_TYPES.PROMO]: [SERVICE_TYPES.BOTH, SERVICE_TYPES.DRY],
  [CAMPAIGN_TYPES.UPSELL]: [SERVICE_TYPES.DRY] // Upsell is specifically for dry service
};

/**
 * Complete coupon matrix - 24 coupons total
 * Each coupon has:
 * - code: Customer-friendly code for POS entry
 * - campaignType: Type of campaign this coupon is for
 * - discountPercent: Discount percentage
 * - serviceType: Which services the discount applies to
 * - description: Human-readable description (Portuguese)
 * - prerequisite: Required previous service (for upsell campaigns)
 */
export const COUPON_MATRIX = {
  // ============================================
  // WIN-BACK COUPONS (12 total)
  // For customers who haven't returned recently
  // ============================================

  // Win-back - All Services (Lavagem + Secagem)
  VOLTE15: {
    code: 'VOLTE15',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },
  VOLTE20: {
    code: 'VOLTE20',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },
  VOLTE25: {
    code: 'VOLTE25',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.BOTH,
    description: '25% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },
  VOLTE30: {
    code: 'VOLTE30',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 30,
    serviceType: SERVICE_TYPES.BOTH,
    description: '30% de desconto em todos os serviços (Win-back)',
    prerequisite: null
  },

  // Win-back - Wash Only
  LAVA15: {
    code: 'LAVA15',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.WASH,
    description: '15% de desconto em lavagem (Win-back)',
    prerequisite: null
  },
  LAVA20: {
    code: 'LAVA20',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.WASH,
    description: '20% de desconto em lavagem (Win-back)',
    prerequisite: null
  },
  LAVA25: {
    code: 'LAVA25',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.WASH,
    description: '25% de desconto em lavagem (Win-back)',
    prerequisite: null
  },
  LAVA30: {
    code: 'LAVA30',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 30,
    serviceType: SERVICE_TYPES.WASH,
    description: '30% de desconto em lavagem (Win-back)',
    prerequisite: null
  },

  // Win-back - Dry Only
  SECA15: {
    code: 'SECA15',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.DRY,
    description: '15% de desconto em secagem (Win-back)',
    prerequisite: null
  },
  SECA20: {
    code: 'SECA20',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.DRY,
    description: '20% de desconto em secagem (Win-back)',
    prerequisite: null
  },
  SECA25: {
    code: 'SECA25',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.DRY,
    description: '25% de desconto em secagem (Win-back)',
    prerequisite: null
  },
  SECA30: {
    code: 'SECA30',
    campaignType: CAMPAIGN_TYPES.WINBACK,
    discountPercent: 30,
    serviceType: SERVICE_TYPES.DRY,
    description: '30% de desconto em secagem (Win-back)',
    prerequisite: null
  },

  // ============================================
  // WELCOME COUPONS (3 total)
  // For first-time or new customers
  // ============================================
  BEM10: {
    code: 'BEM10',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.BOTH,
    description: '10% de desconto de boas-vindas',
    prerequisite: 'Lavou e Secou' // Must have used wash+dry before
  },
  BEM15: {
    code: 'BEM15',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto de boas-vindas',
    prerequisite: 'Lavou e Secou'
  },
  BEM20: {
    code: 'BEM20',
    campaignType: CAMPAIGN_TYPES.WELCOME,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto de boas-vindas',
    prerequisite: 'Lavou e Secou'
  },

  // ============================================
  // PROMOTIONAL COUPONS (6 total)
  // For seasonal/special promotions
  // ============================================

  // Promo - All Services
  PROMO10: {
    code: 'PROMO10',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.BOTH,
    description: '10% de desconto promocional',
    prerequisite: null
  },
  PROMO15: {
    code: 'PROMO15',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.BOTH,
    description: '15% de desconto promocional',
    prerequisite: null
  },
  PROMO20: {
    code: 'PROMO20',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.BOTH,
    description: '20% de desconto promocional',
    prerequisite: null
  },
  PROMO25: {
    code: 'PROMO25',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 25,
    serviceType: SERVICE_TYPES.BOTH,
    description: '25% de desconto promocional',
    prerequisite: null
  },

  // Promo - Dry Only (for seasonal dry promotions)
  PSEC15: {
    code: 'PSEC15',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.DRY,
    description: '15% de desconto promocional em secagem',
    prerequisite: null
  },
  PSEC20: {
    code: 'PSEC20',
    campaignType: CAMPAIGN_TYPES.PROMO,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.DRY,
    description: '20% de desconto promocional em secagem',
    prerequisite: null
  },

  // ============================================
  // UPSELL COUPONS (3 total)
  // For customers who only washed - encourage drying
  // ============================================
  SEQUE10: {
    code: 'SEQUE10',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    discountPercent: 10,
    serviceType: SERVICE_TYPES.DRY,
    description: '10% de desconto em secagem (Upsell)',
    prerequisite: 'Lavou' // Must have used wash service
  },
  SEQUE15: {
    code: 'SEQUE15',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    discountPercent: 15,
    serviceType: SERVICE_TYPES.DRY,
    description: '15% de desconto em secagem (Upsell)',
    prerequisite: 'Lavou'
  },
  SEQUE20: {
    code: 'SEQUE20',
    campaignType: CAMPAIGN_TYPES.UPSELL,
    discountPercent: 20,
    serviceType: SERVICE_TYPES.DRY,
    description: '20% de desconto em secagem (Upsell)',
    prerequisite: 'Lavou'
  }
};

/**
 * Maps template IDs to their campaign types
 * Used to determine which coupons are available for each template
 */
export const TEMPLATE_CAMPAIGN_TYPE_MAP = {
  'winback_discount': CAMPAIGN_TYPES.WINBACK,
  'winback_wash_only': CAMPAIGN_TYPES.WINBACK,
  'winback_dry_only': CAMPAIGN_TYPES.WINBACK,
  'winback_gentle': CAMPAIGN_TYPES.WINBACK,
  'winback_urgency': CAMPAIGN_TYPES.WINBACK,
  'welcome_new': CAMPAIGN_TYPES.WELCOME,
  'welcome_first_visit': CAMPAIGN_TYPES.WELCOME,
  'promo_general': CAMPAIGN_TYPES.PROMO,
  'promo_secagem': CAMPAIGN_TYPES.PROMO,
  'promo_seasonal': CAMPAIGN_TYPES.PROMO,
  'upsell_secagem': CAMPAIGN_TYPES.UPSELL,
  'upsell_dryer': CAMPAIGN_TYPES.UPSELL,
  'reactivation_long_absence': CAMPAIGN_TYPES.WINBACK
};

/**
 * Get the coupon code for a given campaign type, discount percentage, and service type
 * @param {string} campaignType - One of CAMPAIGN_TYPES
 * @param {number} discountPercent - Discount percentage
 * @param {string} serviceType - One of SERVICE_TYPES
 * @returns {object|null} Coupon object or null if not found
 */
export function getCoupon(campaignType, discountPercent, serviceType) {
  const coupon = Object.values(COUPON_MATRIX).find(
    c => c.campaignType === campaignType &&
         c.discountPercent === discountPercent &&
         c.serviceType === serviceType
  );
  return coupon || null;
}

/**
 * Get all coupons for a specific campaign type
 * @param {string} campaignType - One of CAMPAIGN_TYPES
 * @returns {object[]} Array of coupon objects
 */
export function getCouponsForCampaignType(campaignType) {
  return Object.values(COUPON_MATRIX).filter(c => c.campaignType === campaignType);
}

/**
 * Get available discount options for a template
 * @param {string} templateId - Template identifier
 * @returns {number[]} Array of available discount percentages
 */
export function getDiscountOptionsForTemplate(templateId) {
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  return DISCOUNT_OPTIONS[campaignType] || [20];
}

/**
 * Get available service options for a template
 * @param {string} templateId - Template identifier
 * @returns {string[]} Array of available service types
 */
export function getServiceOptionsForTemplate(templateId) {
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  return SERVICE_OPTIONS[campaignType] || [SERVICE_TYPES.BOTH];
}

/**
 * Get the appropriate coupon for a template based on user selections
 * @param {string} templateId - Template identifier
 * @param {number} discountPercent - Selected discount percentage
 * @param {string} serviceType - Selected service type
 * @returns {object|null} Coupon object or null if not found
 */
export function getCouponForTemplate(templateId, discountPercent, serviceType) {
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  return getCoupon(campaignType, discountPercent, serviceType);
}

/**
 * Get default coupon for a template (used as fallback)
 * @param {string} templateId - Template identifier
 * @returns {object} Default coupon for the template
 */
export function getDefaultCouponForTemplate(templateId) {
  const campaignType = TEMPLATE_CAMPAIGN_TYPE_MAP[templateId];
  const defaultDiscounts = {
    [CAMPAIGN_TYPES.WINBACK]: 20,
    [CAMPAIGN_TYPES.WELCOME]: 15,
    [CAMPAIGN_TYPES.PROMO]: 15,
    [CAMPAIGN_TYPES.UPSELL]: 15
  };
  const defaultServiceTypes = {
    [CAMPAIGN_TYPES.WINBACK]: SERVICE_TYPES.BOTH,
    [CAMPAIGN_TYPES.WELCOME]: SERVICE_TYPES.BOTH,
    [CAMPAIGN_TYPES.PROMO]: SERVICE_TYPES.BOTH,
    [CAMPAIGN_TYPES.UPSELL]: SERVICE_TYPES.DRY
  };

  return getCoupon(
    campaignType,
    defaultDiscounts[campaignType],
    defaultServiceTypes[campaignType]
  );
}

// Export all coupons as an array for iteration
export const ALL_COUPONS = Object.values(COUPON_MATRIX);

// Export coupon codes as a simple array for validation
export const VALID_COUPON_CODES = Object.keys(COUPON_MATRIX);
