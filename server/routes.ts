import type { Express } from "express";
import { createServer, type Server } from "node:http";
import OpenAI from "openai";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { createOrUpdateContact, moveContactToList } from "./brevo";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" });
      }

      const normalizedEmail = email.toLowerCase().trim();

      const existing = await storage.getUserByUsername(normalizedEmail);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username: normalizedEmail,
        password: hashedPassword,
        name: name.trim(),
      });

      res.json({
        success: true,
        user: {
          email: user.username,
          name: user.name,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await storage.getUserByUsername(normalizedEmail);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({
        success: true,
        user: {
          email: user.username,
          name: user.name,
          subscriptionTier: user.subscriptionTier,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.post("/api/triage", async (req, res) => {
    try {
      const { symptoms, petName, breed, species, age, weight } = req.body;

      if (!symptoms || !petName) {
        return res.status(400).json({ error: "Symptoms and pet name are required" });
      }

      const systemPrompt = `You are a veterinary triage AI assistant. You help pet owners assess the urgency of their pet's symptoms. You are NOT a replacement for a veterinarian - always recommend professional care.

Analyze the symptoms described and respond with a JSON object in this exact format:
{
  "urgency": "urgent" | "moderate" | "low",
  "urgencyLabel": "Urgent Action Required" | "Monitor Closely" | "Low Concern",
  "urgencyMessage": "A brief 1-sentence directive about what to do immediately",
  "analysisSummary": "A detailed 2-3 sentence analysis of what might be happening based on the symptoms described",
  "keyFindings": ["Finding 1 with medical reasoning", "Finding 2 with medical reasoning", "Finding 3 with medical reasoning"],
  "actionSteps": ["Step 1 - specific actionable instruction", "Step 2 - specific actionable instruction", "Step 3 - specific actionable instruction"],
  "disclaimer": "A brief reminder that this is AI guidance and not a substitute for professional veterinary care"
}

Consider breed-specific vulnerabilities when assessing urgency. Be thorough but clear. Use plain language pet owners can understand. If symptoms suggest any life-threatening condition, always mark as urgent.`;

      const userPrompt = `Pet Information:
- Name: ${petName}
- Species: ${species || 'dog'}
- Breed: ${breed || 'Unknown'}
- Age: ${age || 'Unknown'}
- Weight: ${weight || 'Unknown'}

Symptoms described by owner:
"${symptoms}"

Please analyze these symptoms and provide your triage assessment.`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error) {
      console.error("Triage error:", error);
      res.status(500).json({ error: "Failed to analyze symptoms" });
    }
  });

  app.post("/api/care-tips", async (req, res) => {
    try {
      const { breed, species, age } = req.body;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "system",
            content: "You are a veterinary care advisor. Provide breed-specific health tips. Respond with a JSON object: { \"tips\": \"A 2-3 sentence paragraph with specific, actionable breed-specific health advice including common health issues, exercise needs, and dietary recommendations.\" }",
          },
          {
            role: "user",
            content: `Provide breed-specific care tips for a ${age || ''} ${breed || species || 'dog'}. Focus on the most important health considerations for this breed.`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 512,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      const result = JSON.parse(content);
      res.json(result);
    } catch (error) {
      console.error("Care tips error:", error);
      res.status(500).json({ error: "Failed to generate care tips" });
    }
  });

  app.patch("/api/users/:username/subscription", async (req, res) => {
    try {
      const { username } = req.params;
      const { tier } = req.body;

      if (!tier || !["free", "premium"].includes(tier)) {
        return res.status(400).json({ error: "Invalid tier. Must be 'free' or 'premium'." });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.json({ username, subscriptionTier: tier });
      }

      const updated = await storage.updateSubscriptionTier(username, tier);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update subscription tier" });
      }

      res.json({ username: updated.username, subscriptionTier: updated.subscriptionTier });
    } catch (error) {
      console.error("Subscription update error:", error);
      res.status(500).json({ error: "Failed to update subscription" });
    }
  });

  app.get("/api/users/:username/subscription", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.json({ username, subscriptionTier: "free" });
      }

      res.json({ username: user.username, subscriptionTier: user.subscriptionTier });
    } catch (error) {
      console.error("Subscription fetch error:", error);
      res.status(500).json({ error: "Failed to fetch subscription" });
    }
  });

  const FREE_LIST_ID = parseInt(process.env.BREVO_FREE_LIST_ID || "2", 10);
  const PREMIUM_LIST_ID = parseInt(process.env.BREVO_PREMIUM_LIST_ID || "3", 10);

  app.post("/api/brevo/signup", async (req, res) => {
    try {
      const { email, firstName, userRole, petName, petSpecies, petBreed } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const attributes: Record<string, string> = {
        FIRSTNAME: firstName || "",
        SUBSCRIPTION_TIER: "free",
      };
      if (userRole) attributes.USER_ROLE = userRole;
      if (petName) attributes.PET_NAME = petName;
      if (petSpecies) attributes.PET_SPECIES = petSpecies;
      if (petBreed) attributes.PET_BREED = petBreed;

      await createOrUpdateContact(email, attributes, [FREE_LIST_ID]);
      res.json({ success: true });
    } catch (error) {
      console.error("Brevo signup sync error:", error);
      res.status(500).json({ success: false, error: "Failed to sync contact to Brevo" });
    }
  });

  app.post("/api/brevo/upgrade", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      await moveContactToList(email, FREE_LIST_ID, PREMIUM_LIST_ID);
      res.json({ success: true });
    } catch (error) {
      console.error("Brevo upgrade sync error:", error);
      res.status(500).json({ success: false, error: "Failed to sync upgrade to Brevo" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
