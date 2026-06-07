export type CheckoutSession = {
  id: string;
  confirmationUrl: string;
  amountRub: number;
  status: "pending" | "mock";
};

function isConfigured(): boolean {
  return Boolean(process.env.YUKASSA_SHOP_ID?.trim() && process.env.YUKASSA_SECRET_KEY?.trim());
}

export function yukassaEnabled(): boolean {
  return isConfigured();
}

/** Create ЮKassa payment or mock checkout for development. */
export async function createEventCheckout(params: {
  eventId: string;
  eventTitle: string;
  amountCents: number;
  userId: string;
  returnUrl: string;
}): Promise<CheckoutSession> {
  const amountRub = Math.max(1, Math.round(params.amountCents / 100));

  if (!isConfigured()) {
    const mockId = `mock_${params.eventId}_${Date.now()}`;
    const url = `${params.returnUrl}${params.returnUrl.includes("?") ? "&" : "?"}checkout=mock&session=${mockId}`;
    return { id: mockId, confirmationUrl: url, amountRub, status: "mock" };
  }

  const shopId = process.env.YUKASSA_SHOP_ID!.trim();
  const secret = process.env.YUKASSA_SECRET_KEY!.trim();
  const idempotenceKey = `${params.userId}-${params.eventId}-${Date.now()}`;

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
    },
    body: JSON.stringify({
      amount: { value: amountRub.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: params.returnUrl },
      description: params.eventTitle.slice(0, 128),
      metadata: { eventId: params.eventId, userId: params.userId },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ЮKassa error: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    id: string;
    confirmation?: { confirmation_url?: string };
  };

  return {
    id: data.id,
    confirmationUrl: data.confirmation?.confirmation_url ?? params.returnUrl,
    amountRub,
    status: "pending",
  };
}
