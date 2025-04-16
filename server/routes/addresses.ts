import { Request, Response } from "express";
import { db } from "../db";
import { userAddresses, addressVerifications, shippingDetails } from "../../shared/schema";
// Import the schemas we created
import { insertUserAddressSchema, insertAddressVerificationSchema, insertShippingDetailsSchema, 
  type InsertUserAddress, type InsertAddressVerification, type InsertShippingDetails 
} from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import * as crypto from "crypto";
import { z } from "zod";

/**
 * Gets all addresses for the authenticated user
 */
export async function getUserAddresses(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, req.user.id),
      orderBy: [
        sql`${userAddresses.isDefault} DESC`,
        sql`${userAddresses.createdAt} DESC`
      ],
      with: {
        verifications: {
          where: eq(addressVerifications.status, "verified"),
          limit: 1,
          orderBy: [sql`${addressVerifications.completedAt} DESC`]
        }
      }
    });

    return res.status(200).json({ addresses });
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return res.status(500).json({ error: "Failed to fetch addresses" });
  }
}

/**
 * Gets a specific address by ID
 */
export async function getAddressById(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid address ID" });
    }

    const address = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, req.user.id)
      ),
      with: {
        verifications: {
          where: eq(addressVerifications.status, "verified"),
          limit: 1,
          orderBy: [sql`${addressVerifications.completedAt} DESC`]
        }
      }
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.status(200).json({ address });
  } catch (error) {
    console.error("Error fetching address:", error);
    return res.status(500).json({ error: "Failed to fetch address" });
  }
}

/**
 * Creates a new address for the user
 */
export async function createAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const validatedData = insertUserAddressSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    // If this is the first address or it's marked as default, handle default status
    if (validatedData.isDefault) {
      // Set all other addresses to non-default
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, req.user.id));
    } else {
      // Check if user has any addresses
      const addressCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(userAddresses)
        .where(eq(userAddresses.userId, req.user.id));

      // If this is the first address, make it default
      if (addressCount[0].count === 0) {
        validatedData.isDefault = true;
      }
    }

    const [newAddress] = await db.insert(userAddresses).values(validatedData).returning();

    // Start verification process if required
    let verificationData = null;
    if (req.body.startVerification) {
      verificationData = await startAddressVerification(newAddress.id, req.body.verificationMethod || 'email');
    }

    return res.status(201).json({ 
      address: newAddress,
      verification: verificationData 
    });
  } catch (error) {
    console.error("Error creating address:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Failed to create address" });
  }
}

/**
 * Updates an existing address
 */
export async function updateAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid address ID" });
    }

    // Check if address exists and belongs to user
    const existingAddress = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, req.user.id)
      ),
    });

    if (!existingAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    // If changing address details that affect verification, reset verification status
    const resetVerification = 
      (req.body.addressLine1 && req.body.addressLine1 !== existingAddress.addressLine1) ||
      (req.body.city && req.body.city !== existingAddress.city) ||
      (req.body.postalCode && req.body.postalCode !== existingAddress.postalCode) ||
      (req.body.country && req.body.country !== existingAddress.country);

    // Validate the update data
    const validatedData = insertUserAddressSchema.partial().parse({
      ...req.body,
      verified: resetVerification ? false : undefined,
      verificationMethod: resetVerification ? null : undefined,
      verificationDate: resetVerification ? null : undefined,
      updatedAt: new Date()
    });

    // If setting as default, update other addresses
    if (validatedData.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(and(
          eq(userAddresses.userId, req.user.id),
          sql`${userAddresses.id} != ${addressId}`
        ));
    }

    const [updatedAddress] = await db
      .update(userAddresses)
      .set(validatedData)
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, req.user.id)
      ))
      .returning();

    // Start verification process if requested
    let verificationData = null;
    if (req.body.startVerification) {
      verificationData = await startAddressVerification(addressId, req.body.verificationMethod || 'email');
    }

    return res.status(200).json({ 
      address: updatedAddress,
      verification: verificationData 
    });
  } catch (error) {
    console.error("Error updating address:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Failed to update address" });
  }
}

/**
 * Deletes an address
 */
export async function deleteAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid address ID" });
    }

    // Check if address exists and belongs to user
    const existingAddress = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, req.user.id)
      ),
    });

    if (!existingAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Delete the address
    await db
      .delete(userAddresses)
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, req.user.id)
      ));

    // If the deleted address was the default, set another address as default
    if (existingAddress.isDefault) {
      const remainingAddress = await db.query.userAddresses.findFirst({
        where: eq(userAddresses.userId, req.user.id),
        orderBy: [sql`${userAddresses.createdAt} ASC`]
      });

      if (remainingAddress) {
        await db
          .update(userAddresses)
          .set({ isDefault: true })
          .where(eq(userAddresses.id, remainingAddress.id));
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ error: "Failed to delete address" });
  }
}

/**
 * Sets an address as the default
 */
export async function setDefaultAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const addressId = parseInt(req.params.id);
    if (isNaN(addressId)) {
      return res.status(400).json({ error: "Invalid address ID" });
    }

    // Check if address exists and belongs to user
    const existingAddress = await db.query.userAddresses.findFirst({
      where: and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, req.user.id)
      ),
    });

    if (!existingAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Set all addresses to non-default
    await db
      .update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, req.user.id));

    // Set the selected address as default
    const [updatedAddress] = await db
      .update(userAddresses)
      .set({ isDefault: true })
      .where(eq(userAddresses.id, addressId))
      .returning();

    return res.status(200).json({ address: updatedAddress });
  } catch (error) {
    console.error("Error setting default address:", error);
    return res.status(500).json({ error: "Failed to set default address" });
  }
}

/**
 * Start the address verification process
 */
async function startAddressVerification(addressId: number, method: string): Promise<any> {
  // Generate verification token
  const verificationToken = crypto.randomBytes(20).toString('hex');
  const tokenExpiryDate = new Date();
  tokenExpiryDate.setHours(tokenExpiryDate.getHours() + 24); // Token valid for 24 hours

  const verificationData = {
    addressId,
    verificationToken,
    tokenExpiryDate,
    status: 'pending',
    verificationMethod: method,
  };

  // Insert verification record
  const [verification] = await db
    .insert(addressVerifications)
    .values(verificationData)
    .returning();

  // Here you would normally send the verification email or SMS, which we'll implement later

  return verification;
}

/**
 * Verify an address using verification token
 */
export async function verifyAddress(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    // Find the verification record
    const verification = await db.query.addressVerifications.findFirst({
      where: eq(addressVerifications.verificationToken, token),
      with: {
        address: true
      }
    });

    if (!verification) {
      return res.status(404).json({ error: "Invalid verification token" });
    }

    // Check if the verification is for the current user's address
    if (verification.address.userId !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized verification attempt" });
    }

    // Check if token has expired
    if (verification.tokenExpiryDate && new Date() > verification.tokenExpiryDate) {
      // Update verification record
      await db
        .update(addressVerifications)
        .set({ status: 'expired' })
        .where(eq(addressVerifications.id, verification.id));

      return res.status(400).json({ error: "Verification token has expired" });
    }

    // Set verification as completed
    await db
      .update(addressVerifications)
      .set({ 
        status: 'verified',
        completedAt: new Date()
      })
      .where(eq(addressVerifications.id, verification.id));

    // Update the address as verified
    const [updatedAddress] = await db
      .update(userAddresses)
      .set({ 
        verified: true,
        verificationDate: new Date(),
        verificationMethod: verification.verificationMethod
      })
      .where(eq(userAddresses.id, verification.addressId))
      .returning();

    return res.status(200).json({ 
      success: true,
      address: updatedAddress
    });
  } catch (error) {
    console.error("Error verifying address:", error);
    return res.status(500).json({ error: "Failed to verify address" });
  }
}

/**
 * Get shipping details for a transaction
 */
export async function getShippingDetails(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const transactionId = parseInt(req.params.transactionId);
    if (isNaN(transactionId)) {
      return res.status(400).json({ error: "Invalid transaction ID" });
    }

    const shipping = await db.query.shippingDetails.findFirst({
      where: eq(shippingDetails.transactionId, transactionId),
    });

    if (!shipping) {
      return res.status(404).json({ error: "Shipping details not found" });
    }

    return res.status(200).json({ shipping });
  } catch (error) {
    console.error("Error fetching shipping details:", error);
    return res.status(500).json({ error: "Failed to fetch shipping details" });
  }
}

/**
 * Update shipping tracking information
 */
export async function updateShippingTracking(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const shippingId = parseInt(req.params.id);
    if (isNaN(shippingId)) {
      return res.status(400).json({ error: "Invalid shipping ID" });
    }

    // Only allow authorized fields to be updated for tracking
    const updateSchema = z.object({
      carrier: z.string().optional(),
      trackingNumber: z.string().optional(),
      shippingMethod: z.string().optional(),
      estimatedDeliveryDate: z.coerce.date().optional(),
      actualDeliveryDate: z.coerce.date().optional(),
      shippingStatus: z.enum(['pending', 'shipped', 'delivered', 'failed']).optional(),
      notes: z.string().optional(),
    });

    const validatedData = updateSchema.parse(req.body);

    const [updatedShipping] = await db
      .update(shippingDetails)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(shippingDetails.id, shippingId))
      .returning();

    return res.status(200).json({ shipping: updatedShipping });
  } catch (error) {
    console.error("Error updating shipping tracking:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: "Failed to update shipping tracking" });
  }
}