import { supabase } from "./supabase";

export interface NameChangeEligibility {
    canChange: boolean;
    changesUsed: number;
    nextAllowedDate: string | null;
    reason: string;
}

/**
 * Check if user can change their profile name (primary pet name)
 * Rules: Maximum 2 changes per 2-month period
 */
export async function checkProfileNameEligibility(
    userId: string
): Promise<NameChangeEligibility> {
    try {
        const { data, error } = await supabase.rpc("can_change_profile_name", {
            p_user_id: userId,
        });

        if (error) throw error;

        const result = data[0];
        return {
            canChange: result.can_change,
            changesUsed: result.changes_used,
            nextAllowedDate: result.next_allowed_date,
            reason: result.reason,
        };
    } catch (error) {
        console.error("Error checking name change eligibility:", error);
        throw error;
    }
}

/**
 * Change the profile name (updates primary pet name)
 * This is a restricted operation - max 2 changes per 2 months
 */
export async function changeProfileName(
    userId: string,
    petId: string,
    oldName: string,
    newName: string
): Promise<boolean> {
    try {
        // 1. Check eligibility first
        const eligibility = await checkProfileNameEligibility(userId);

        if (!eligibility.canChange) {
            throw new Error(eligibility.reason);
        }

        // 2. Log the change
        const { error: logError } = await supabase
            .from("profile_name_changes")
            .insert({
                user_id: userId,
                pet_id: petId,
                old_name: oldName,
                new_name: newName,
            });

        if (logError) throw logError;

        // 3. Update the pet's name
        const { error: petError } = await supabase
            .from("pets")
            .update({ name: newName })
            .eq("id", petId)
            .eq("owner_id", userId); // Security check

        if (petError) throw petError;

        // 4. Update user's change counter
        const now = new Date().toISOString();
        const newCount = eligibility.changesUsed + 1;

        const { error: userError } = await supabase
            .from("users")
            .update({
                profile_name_changes: newCount,
                profile_name_last_changed: now,
            })
            .eq("id", userId);

        if (userError) throw userError;

        return true;
    } catch (error) {
        console.error("Error changing profile name:", error);
        throw error;
    }
}

/**
 * Get profile name change history for a user
 */
export async function getNameChangeHistory(userId: string) {
    try {
        const { data, error } = await supabase
            .from("profile_name_changes")
            .select("*")
            .eq("user_id", userId)
            .order("changed_at", { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching name change history:", error);
        throw error;
    }
}

/**
 * Set a pet as the primary/default pet
 * This updates the profile display and posts context
 */
export async function setPrimaryPet(
    userId: string,
    petId: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase.rpc("set_primary_pet", {
            p_user_id: userId,
            p_pet_id: petId,
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error setting primary pet:", error);
        throw error;
    }
}

/**
 * Get user's primary pet
 */
export async function getPrimaryPet(userId: string) {
    try {
        const { data, error } = await supabase
            .from("users")
            .select(
                `
        primary_pet_id,
        pets!users_primary_pet_id_fkey (
          id,
          name,
          species,
          breed,
          age,
          gender,
          avatar,
          bio
        )
      `
            )
            .eq("id", userId)
            .single();

        if (error) throw error;
        return data?.pets;
    } catch (error) {
        console.error("Error fetching primary pet:", error);
        return null;
    }
}

/**
 * Get all pets for a user with their display order
 */
export async function getUserPets(userId: string) {
    try {
        const { data, error } = await supabase
            .from("pets")
            .select("*")
            .eq("owner_id", userId)
            .eq("page_active", true)
            .order("display_order", { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching user pets:", error);
        return [];
    }
}

/**
 * Update pet display order (for bubble arrangement)
 */
export async function updatePetDisplayOrder(
    petId: string,
    userId: string,
    newOrder: number
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from("pets")
            .update({ display_order: newOrder })
            .eq("id", petId)
            .eq("owner_id", userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error("Error updating pet display order:", error);
        throw error;
    }
}
