/**
 * Copy website content from source website to target website
 * Used to initialize new websites with content from golden-crumb
 */

import { supabase } from "./supabase";

/**
 * Get the golden-crumb website ID
 */
async function getGoldenCrumbWebsiteId(): Promise<string | null> {
  const { data, error } = await supabase
    .from("websites")
    .select("id")
    .eq("subdomain", "golden-crumb")
    .maybeSingle();

  if (error) {
    console.error("Error finding golden-crumb website:", error);
    return null;
  }

  if (!data) {
    console.error("golden-crumb website not found in database");
    return null;
  }

  return (data as any)?.id;
}

/**
 * Copy all content from source website to target website
 * @param enabledSections - Optional array of section names to enable. If not provided, all sections except specialOffers will be enabled.
 */
/**
 * Copy all content from source website to target website
 * @param enabledSections - Optional array of section names to enable. If not provided, all sections except specialOffers will be enabled.
 */
export async function copyWebsiteContent(
  targetWebsiteId: string,
  sourceWebsiteId?: string,
  enabledSections?: string[],
): Promise<void> {
  try {
    // If no source website provided, use golden-crumb as default
    const sourceId = sourceWebsiteId || (await getGoldenCrumbWebsiteId());

    if (!sourceId) {
      throw new Error(
        "Source website (golden-crumb) not found. Please ensure golden-crumb website exists.",
      );
    }

    console.log(
      `📋 Copying content from website ${sourceId} to ${targetWebsiteId}...`,
    );

    // Fetch source website data
    const { data: sourceWebsite, error: sourceError } = await supabase
      .from("websites")
      .select("*")
      .eq("id", sourceId)
      .single();

    if (sourceError || !sourceWebsite) {
      throw new Error(
        `Failed to fetch source website: ${sourceError?.message}`,
      );
    }

    const source = sourceWebsite as any;

    // Check if target website exists
    const { data: targetWebsite, error: targetError } = await supabase
      .from("websites")
      .select("id")
      .eq("id", targetWebsiteId)
      .single();

    if (targetError) {
      // If target doesn't exist (which shouldn't happen usually for this op), we can't update it
      if (targetError.code === "PGRST116") {
        console.error("Target website does not exist to copy content to.");
        return;
      }
      throw targetError;
    }

    // Determine enabled sections
    let newEnabledSections = source.enabledsections;
    if (enabledSections) {
      // If specific sections requested, verify they exist in source content before enabling?
      // For now, just trust the passed array or wrap string references
      newEnabledSections = enabledSections;
    }

    // Prepare update payload
    const updatePayload = {
      theme: source.theme,
      content: source.content,
      messenger: source.messenger,
      contactformconfig: source.contactformconfig,
      marketing: source.marketing,
      enabledsections: newEnabledSections,
      updatedat: new Date().toISOString(),
    };

    // Update target website
    const { error: updateError } = await supabase
      .from("websites")
      // @ts-ignore
      .update(updatePayload as any)
      .eq("id", targetWebsiteId);

    if (updateError) {
      throw new Error(
        `Failed to update target website content: ${updateError.message}`,
      );
    }

    console.log(
      "✅ Successfully copied all content (JSONB) from source to target website",
    );
  } catch (error) {
    console.error("❌ Error copying website content:", error);
    throw error;
  }
}
