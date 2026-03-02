const BREVO_API_URL = "https://api.brevo.com/v3";

function getApiKey(): string {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    throw new Error("BREVO_API_KEY is not configured");
  }
  return key;
}

interface BrevoContactAttributes {
  FIRSTNAME?: string;
  USER_ROLE?: string;
  PET_NAME?: string;
  PET_SPECIES?: string;
  PET_BREED?: string;
  SUBSCRIPTION_TIER?: string;
}

export async function createOrUpdateContact(
  email: string,
  attributes: BrevoContactAttributes,
  listIds: number[],
): Promise<void> {
  const apiKey = getApiKey();

  const body = {
    email: email.toLowerCase().trim(),
    attributes,
    listIds,
    updateEnabled: true,
  };

  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Brevo createOrUpdateContact failed (${response.status}):`, errorText);
    throw new Error(`Brevo API error: ${response.status}`);
  }
}

export async function removeContactFromList(
  email: string,
  listId: number,
): Promise<void> {
  const apiKey = getApiKey();

  const response = await fetch(`${BREVO_API_URL}/contacts/lists/${listId}/contacts/remove`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ emails: [email.toLowerCase().trim()] }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Brevo removeContactFromList failed (${response.status}):`, errorText);
  }
}

export async function moveContactToList(
  email: string,
  removeFromListId: number,
  addToListId: number,
  updatedAttributes?: BrevoContactAttributes,
): Promise<void> {
  await removeContactFromList(email, removeFromListId);

  await createOrUpdateContact(
    email,
    { ...updatedAttributes, SUBSCRIPTION_TIER: "premium" },
    [addToListId],
  );
}
