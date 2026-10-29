export async function onRequestGet() {
  return Response.json({
    ok: true,
    message: "Payment API is running"
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const { amount, description } = await request.json();

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 100000
    ) {
      return Response.json(
        { ok: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    const merchantId = env.PLATEGA_MERCHANT_ID;
    const secret = env.PLATEGA_SECRET;

    if (!merchantId || !secret) {
      return Response.json(
        { ok: false, error: "Payment settings are missing" },
        { status: 500 }
      );
    }

    const paymentResponse = await fetch(
      "https://app.platega.io/v2/transaction/process",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MerchantId": merchantId,
          "X-Secret": secret
        },
        body: JSON.stringify({
          paymentDetails: {
            amount,
            currency: "RUB"
          },
          description: String(description || "Оплата заказа").slice(0, 200),
          return: "https://example.com/success",
          failedUrl: "https://example.com/fail"
        })
      }
    );

    const data = await paymentResponse.json();

    if (!paymentResponse.ok) {
      return Response.json(
        { ok: false, error: "Payment provider rejected the request" },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      paymentUrl: data.url,
      transactionId: data.transactionId
    });
  } catch {
    return Response.json(
      { ok: false, error: "Could not create payment" },
      { status: 500 }
    );
  }
}
