import { Request, Response, Router } from 'express';
import { storage } from '../storage-new';
import { InsertSystemSecret } from '@shared/schema';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { openAIService } from '../services/intelligent-ai/openai-service';

// For verifying OpenAI keys
let OpenAI: any = null;
try {
  const openaiModule = require('openai');
  OpenAI = openaiModule.default || openaiModule;
  console.log("OpenAI package loaded for key verification");
} catch (err) {
  console.warn("OpenAI package not available for verification");
}

const router = Router();

// Get all system settings
router.get('/system-settings', async (req: Request, res: Response) => {
  try {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Failed to retrieve system settings' });
  }
});

// Update system setting
router.patch('/system-settings/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedSetting = await storage.updateSystemSettings({
      id,
      ...req.body
    });
    
    if (!updatedSetting) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(updatedSetting);
  } catch (error) {
    console.error('Error updating system setting:', error);
    res.status(500).json({ error: 'Failed to update system setting' });
  }
});

// Get all system secrets (only returns masked values for security)
router.get('/system-secrets', async (req: Request, res: Response) => {
  try {
    const secrets = await storage.getSystemSecrets();
    
    // Return only masked versions of secrets for security
    const maskedSecrets = secrets.map(secret => ({
      ...secret,
      value: secret.value ? 
        `${secret.value.substring(0, 3)}...${secret.value.substring(secret.value.length - 4)}` : 
        ''
    }));
    
    res.json(maskedSecrets);
  } catch (error) {
    console.error('Error fetching system secrets:', error);
    res.status(500).json({ error: 'Failed to retrieve system secrets' });
  }
});

// Create a new system secret
router.post('/system-secrets', async (req: Request, res: Response) => {
  try {
    const secretData: InsertSystemSecret = {
      key: req.body.key,
      value: req.body.value,
      category: req.body.category || 'general',
      description: req.body.description || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    
    const newSecret = await storage.createSystemSecret(secretData);
    
    // Mask the value in the response for security
    const maskedSecret = {
      ...newSecret,
      value: newSecret.value ? 
        `${newSecret.value.substring(0, 3)}...${newSecret.value.substring(newSecret.value.length - 4)}` : 
        ''
    };
    
    res.status(201).json(maskedSecret);
  } catch (error) {
    console.error('Error creating system secret:', error);
    res.status(500).json({ error: 'Failed to create system secret' });
  }
});

// Update system secret
router.patch('/system-secrets/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updatedSecret = await storage.updateSystemSecret(id, req.body);
    
    if (!updatedSecret) {
      return res.status(404).json({ error: 'Secret not found' });
    }
    
    // For OpenAI API key specifically, update the environment variable
    if (updatedSecret.key === 'OPENAI_API_KEY' && updatedSecret.isActive && updatedSecret.value) {
      process.env.OPENAI_API_KEY = updatedSecret.value;
      console.log('OpenAI API key updated in environment');
    }
    
    // Mask the value in the response for security
    const maskedSecret = {
      ...updatedSecret,
      value: updatedSecret.value ? 
        `${updatedSecret.value.substring(0, 3)}...${updatedSecret.value.substring(updatedSecret.value.length - 4)}` : 
        ''
    };
    
    res.json(maskedSecret);
  } catch (error) {
    console.error('Error updating system secret:', error);
    res.status(500).json({ error: 'Failed to update system secret' });
  }
});

// Delete system secret
router.delete('/system-secrets/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await storage.deleteSystemSecret(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Secret not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting system secret:', error);
    res.status(500).json({ error: 'Failed to delete system secret' });
  }
});

// Verify OpenAI API key
router.post('/verify-openai-key', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required', valid: false });
    }
    
    // If OpenAI package isn't available, we can't verify
    if (!OpenAI) {
      return res.status(503).json({ 
        error: 'OpenAI package not available for verification',
        valid: false,
        reason: 'package_unavailable'
      });
    }
    
    try {
      // Create a temporary client to test the key
      const client = new OpenAI({ apiKey });
      
      // Make a simple request to verify the key
      const models = await client.models.list();
      
      if (models && models.data) {
        return res.json({ valid: true });
      } else {
        return res.json({ valid: false, reason: 'unexpected_response' });
      }
    } catch (apiError: any) {
      console.error('Error verifying OpenAI API key:', apiError.message);
      
      if (apiError.status === 401) {
        return res.json({ valid: false, reason: 'invalid_key' });
      } else {
        return res.json({ valid: false, reason: 'api_error', message: apiError.message });
      }
    }
  } catch (error) {
    console.error('Server error during API key verification:', error);
    res.status(500).json({ error: 'Failed to verify API key', valid: false });
  }
});

// Check if OpenAI API key is needed
router.get('/openai-key-needed', async (req: Request, res: Response) => {
  try {
    // Use the OpenAI service to check if an API key is needed
    const isKeyNeeded = openAIService.isApiKeyNeeded();
    
    res.json({
      isKeyNeeded,
      message: isKeyNeeded 
        ? 'OpenAI API key is required for enhanced AI and KYC functionality.' 
        : 'OpenAI API key is already configured or not required for current functionality.'
    });
  } catch (error) {
    console.error('Error checking if OpenAI API key is needed:', error);
    res.status(500).json({ 
      error: 'Failed to check if OpenAI API key is needed',
      isKeyNeeded: false 
    });
  }
});

export default router;