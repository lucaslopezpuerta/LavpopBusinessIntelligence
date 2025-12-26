/**
 * Tests for Campaign Service
 * @module campaignService.test
 *
 * Note: All campaign functions are async (backed by Supabase API)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCampaigns,
  saveCampaign,
  updateCampaign,
  recordCampaignSend,
  getCampaignSends,
  getAutomationRules,
  saveAutomationRules,
  findAutomationTargets,
  getCommunicationLogs,
  MESSAGE_TEMPLATES,
  getTemplate,
  validateCampaignAudience,
  isBlacklisted
} from '../utils/campaignService';
import { clearBlacklist, addToBlacklist } from '../utils/blacklistService';

describe('Campaign Management (async API)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCampaigns', () => {
    it('should return empty array when no campaigns exist', async () => {
      const campaigns = await getCampaigns();
      expect(campaigns).toEqual([]);
    });
  });

  describe('saveCampaign', () => {
    it('should create campaign and return it', async () => {
      const campaign = await saveCampaign({
        name: 'Test Campaign',
        templateId: 'winback_30days',
        audience: 'atRisk'
      });

      expect(campaign).toBeDefined();
    });
  });

  describe('updateCampaign', () => {
    it('should return null for non-existent campaign', async () => {
      const result = await updateCampaign('CAMP_nonexistent', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('getCampaignSends', () => {
    it('should return array', async () => {
      const sends = await getCampaignSends();
      expect(Array.isArray(sends)).toBe(true);
    });
  });
});

describe('Automation Rules (async API)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAutomationRules', () => {
    it('should return rules array', async () => {
      const rules = await getAutomationRules();
      expect(Array.isArray(rules)).toBe(true);
    });
  });

  describe('saveAutomationRules', () => {
    it('should save without errors', async () => {
      const rules = [
        { id: 'test_rule', name: 'Test', enabled: true }
      ];

      const result = await saveAutomationRules(rules);
      expect(result).toBeDefined();
    });
  });

  describe('findAutomationTargets', () => {
    const customers = [
      { id: 1, daysSinceLastVisit: 35, phone: '54996923504', riskLevel: 'At Risk' },
      { id: 2, daysSinceLastVisit: 10, phone: '54996923505', riskLevel: 'Healthy' },
      { id: 3, daysSinceLastVisit: 0, phone: '54996923506', riskLevel: 'New Customer' },
      { id: 4, daysSinceLastVisit: 20, phone: '5436923504', riskLevel: 'Healthy' }, // landline
      { id: 5, daysSinceLastVisit: 50, phone: '54996923507', walletBalance: 25, riskLevel: 'At Risk' }
    ];

    it('should find customers based on days_since_visit trigger', () => {
      const rule = {
        trigger: { type: 'days_since_visit', value: 30 }
      };

      const targets = findAutomationTargets(rule, customers);

      // Should include id:1 and id:5 (both 30+ days, valid phones)
      expect(targets).toHaveLength(2);
      expect(targets.map(t => t.id)).toContain(1);
      expect(targets.map(t => t.id)).toContain(5);
    });

    it('should find customers based on first_purchase trigger', () => {
      const rule = {
        trigger: { type: 'first_purchase', value: 1 }
      };

      const targets = findAutomationTargets(rule, customers);

      // Should include id:3 (New Customer with valid phone)
      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe(3);
    });

    it('should find customers based on wallet_balance trigger', () => {
      const rule = {
        trigger: { type: 'wallet_balance', value: 20 }
      };

      const targets = findAutomationTargets(rule, customers);

      // Should include id:5 (wallet >= 20, 14+ days since visit, valid phone)
      expect(targets).toHaveLength(1);
      expect(targets[0].id).toBe(5);
    });

    it('should filter out customers without valid mobile phones', () => {
      const rule = {
        trigger: { type: 'days_since_visit', value: 15 }
      };

      const targets = findAutomationTargets(rule, customers);

      // id:4 has landline, should be excluded
      expect(targets.map(t => t.id)).not.toContain(4);
    });

    it('should return empty array for unknown trigger type', () => {
      const rule = {
        trigger: { type: 'unknown_trigger', value: 1 }
      };

      const targets = findAutomationTargets(rule, customers);
      expect(targets).toEqual([]);
    });
  });
});

describe('Communication Logs (async API)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCommunicationLogs', () => {
    it('should return array', async () => {
      const logs = await getCommunicationLogs();
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});

describe('Message Templates', () => {
  describe('MESSAGE_TEMPLATES', () => {
    it('should have required template structure', () => {
      expect(MESSAGE_TEMPLATES).toHaveProperty('winback_30days');
      expect(MESSAGE_TEMPLATES.winback_30days).toHaveProperty('name');
      expect(MESSAGE_TEMPLATES.winback_30days).toHaveProperty('variables');
      expect(MESSAGE_TEMPLATES.winback_30days).toHaveProperty('category');
    });
  });

  describe('getTemplate', () => {
    it('should return template by name', () => {
      const template = getTemplate('winback_30days');
      expect(template).not.toBeNull();
      expect(template.name).toBe('Win-back 30 dias');
    });

    it('should return null for unknown template', () => {
      const template = getTemplate('nonexistent');
      expect(template).toBeNull();
    });
  });
});

describe('validateCampaignAudience (async API)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await clearBlacklist();
  });

  it('should separate ready, invalid, and blacklisted customers', async () => {
    // Add one to blacklist
    await addToBlacklist('54996923502', { reason: 'opt-out' });

    const customers = [
      { phone: '54996923501', name: 'Valid' },       // ready
      { phone: '54996923502', name: 'Blocked' },    // blacklisted
      { phone: '123', name: 'Invalid' }              // invalid phone
    ];

    const result = await validateCampaignAudience(customers);

    expect(result.ready).toHaveLength(1);
    expect(result.ready[0].name).toBe('Valid');

    expect(result.blacklisted).toHaveLength(1);
    expect(result.blacklisted[0].name).toBe('Blocked');

    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].name).toBe('Invalid');
  });

  it('should include detailed stats', async () => {
    await addToBlacklist('54996923502', { reason: 'opt-out' });
    await addToBlacklist('54996923503', { reason: 'undelivered' });

    const customers = [
      { phone: '54996923501', name: 'Valid' },
      { phone: '54996923502', name: 'OptOut' },
      { phone: '54996923503', name: 'Undelivered' },
      { phone: '123', name: 'Invalid' }
    ];

    const result = await validateCampaignAudience(customers);

    expect(result.stats.readyCount).toBe(1);
    expect(result.stats.invalidCount).toBe(1);
    expect(result.stats.blacklistedCount).toBe(2);
    expect(result.stats.blacklistedByOptOut).toBe(1);
    expect(result.stats.blacklistedByUndelivered).toBe(1);
  });
});

describe('isBlacklisted re-export', () => {
  beforeEach(async () => {
    await clearBlacklist();
  });

  it('should check if phone is blacklisted', async () => {
    expect(await isBlacklisted('54996923504')).toBe(false);

    await addToBlacklist('54996923504');
    expect(await isBlacklisted('54996923504')).toBe(true);
  });
});
