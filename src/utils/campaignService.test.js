/**
 * Tests for Campaign Service
 * @module campaignService.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
} from './campaignService';
import { clearBlacklist, addToBlacklist } from './blacklistService';

describe('Campaign Management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCampaigns', () => {
    it('should return empty array when no campaigns exist', () => {
      expect(getCampaigns()).toEqual([]);
    });

    it('should return saved campaigns', () => {
      const campaign = saveCampaign({ name: 'Test Campaign' });
      const campaigns = getCampaigns();

      expect(campaigns).toHaveLength(1);
      expect(campaigns[0].name).toBe('Test Campaign');
    });
  });

  describe('saveCampaign', () => {
    it('should create campaign with auto-generated ID and timestamps', () => {
      const campaign = saveCampaign({
        name: 'Test Campaign',
        templateId: 'winback_30days',
        audience: 'atRisk'
      });

      expect(campaign.id).toMatch(/^CAMP_\d+$/);
      expect(campaign.createdAt).toBeDefined();
      expect(campaign.status).toBe('draft');
      expect(campaign.sends).toBe(0);
    });

    it('should persist campaign to localStorage', () => {
      saveCampaign({ name: 'Test' });

      const stored = JSON.parse(localStorage.getItem('lavpop_campaigns'));
      expect(stored).toHaveLength(1);
    });
  });

  describe('updateCampaign', () => {
    it('should update existing campaign', () => {
      const campaign = saveCampaign({ name: 'Original' });
      const updated = updateCampaign(campaign.id, { name: 'Updated' });

      expect(updated.name).toBe('Updated');
      expect(updated.updatedAt).toBeDefined();
    });

    it('should return null for non-existent campaign', () => {
      const result = updateCampaign('CAMP_nonexistent', { name: 'Test' });
      expect(result).toBeNull();
    });
  });

  describe('recordCampaignSend', () => {
    it('should update campaign stats', () => {
      const campaign = saveCampaign({ name: 'Test' });

      recordCampaignSend(campaign.id, {
        recipients: 10,
        successCount: 8,
        failedCount: 2
      });

      const campaigns = getCampaigns();
      expect(campaigns[0].sends).toBe(8);
      expect(campaigns[0].status).toBe('active');
      expect(campaigns[0].lastSentAt).toBeDefined();
    });

    it('should accumulate sends over multiple batches', () => {
      const campaign = saveCampaign({ name: 'Test' });

      recordCampaignSend(campaign.id, { successCount: 5 });
      recordCampaignSend(campaign.id, { successCount: 3 });

      const campaigns = getCampaigns();
      expect(campaigns[0].sends).toBe(8);
    });
  });

  describe('getCampaignSends', () => {
    it('should return all sends when no campaignId provided', () => {
      const c1 = saveCampaign({ name: 'Campaign 1' });
      const c2 = saveCampaign({ name: 'Campaign 2' });

      recordCampaignSend(c1.id, { successCount: 5 });
      recordCampaignSend(c2.id, { successCount: 3 });

      const sends = getCampaignSends();
      expect(sends).toHaveLength(2);
    });

    it('should filter by campaignId', () => {
      // This test uses fresh state from beforeEach's localStorage.clear()
      const c1 = saveCampaign({ name: 'Campaign 1' });
      const c2 = saveCampaign({ name: 'Campaign 2' });

      recordCampaignSend(c1.id, { successCount: 5 });
      recordCampaignSend(c2.id, { successCount: 3 });

      const allSends = getCampaignSends();
      expect(allSends.length).toBeGreaterThanOrEqual(2);

      const c1Sends = getCampaignSends(c1.id);
      // Filter should return only sends for c1
      const c1SendsFiltered = c1Sends.filter(s => s.campaignId === c1.id);
      expect(c1SendsFiltered).toHaveLength(c1Sends.length);
    });
  });
});

describe('Automation Rules', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAutomationRules', () => {
    it('should return default rules when none saved', () => {
      const rules = getAutomationRules();

      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('enabled');
    });
  });

  describe('saveAutomationRules', () => {
    it('should persist rules to localStorage', () => {
      const rules = [
        { id: 'test_rule', name: 'Test', enabled: true }
      ];

      saveAutomationRules(rules);

      const stored = JSON.parse(localStorage.getItem('lavpop_automation_rules'));
      expect(stored).toEqual(rules);
    });

    it('should be retrievable after save', () => {
      const rules = [
        { id: 'test', name: 'Test Rule', enabled: true }
      ];

      saveAutomationRules(rules);
      const retrieved = getAutomationRules();

      expect(retrieved[0].id).toBe('test');
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

describe('Communication Logs', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getCommunicationLogs', () => {
    it('should return empty array when no logs', () => {
      expect(getCommunicationLogs()).toEqual([]);
    });

    it('should filter by phone when provided', () => {
      // Logs are created internally by sendWhatsAppMessage
      // For this test, we manually set up logs
      const logs = [
        { phone: '+5554996923504', channel: 'whatsapp', timestamp: new Date().toISOString() },
        { phone: '+5554996923505', channel: 'whatsapp', timestamp: new Date().toISOString() }
      ];
      localStorage.setItem('lavpop_comm_log', JSON.stringify(logs));

      const filtered = getCommunicationLogs('+5554996923504');
      expect(filtered).toHaveLength(1);
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

describe('validateCampaignAudience', () => {
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
