const PRODUCTS = {
  "33 Гема": 100,
  "88 Гемов": 150,
  "187 Гемов": 290,
  "396 Гемов": 400,
  "1045 Гемов": 800,
  "2200 Гемов": 1350,
  "Brawl Pass": 300,
  "Brawl Pass Plus": 400,
  "PRO Pass": 600,

  "500 Кристаллов": 150,
  "1 200 Кристаллов": 250,
  "2 500 Кристаллов": 350,
  "6 500 Кристаллов": 750,
  "14 000 Кристаллов": 1350,
  "28 000 Кристаллов": 1950,
  "Diamond Pass": 400,

  "3 700 Гемов": 400,
  "6 500 Гемов": 750,
  "9 000 Гемов": 950,
  "10 000 Гемов": 1000,
  "14 000 Гемов": 1250,
  "28 000 Гемов": 1900,
  "GOLD PASS": 200
};

export async function onRequestGet({ env }) {
  return Response.json({
    ok: true,
    hasMerchantId: Boolean(env.PLATEGA_MERCHANT_ID),
    hasSecret: Boolean(env.PLATEGA_SECRET)
  });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return Response.json(
        { ok: false, error: "Корзина пуста" },
        { status: 400 }
      );
    }

    if (body.items.length > 30) {
      return Response.json(
        { ok: false, error: "Слишком много товаров" },
        { status: 400 }
      );
    }

    let amount = 0;

    for (const item of body.items) {
      if (
        !item ||
        typeof item.name !== "string" ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 20 ||
        !Object.hasOwn(PRODUCTS, item.name)
      ) {
        return Response.json(
          { ok: false, error: "Некорректный товар или количество" },
          { status: 400 }
        );
      }

      amount += PRODUCTS[item.name] * item.quantity;
    }

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return Response.json(
        { ok: false, error: "Некорректная сумма" },
        { status: 400 }
      );
    }

   if (!env.PLATEGA_MERCHANT_ID || !env.PLATEGA_SECRET) {
  return Response.json({
    ok: false,
    hasMerchantId: Boolean(env.PLATEGA_MERCHANT_ID),
    hasSecret: Boolean(env.PLATEGA_SECRET),
    error: "Не найдены переменные оплаты"
  }, { status: 500 });
}

    const paymentResponse = await fetch(
      "https://app.platega.io/v2/transaction/process",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MerchantId": env.PLATEGA_MERCHANT_ID,
          "X-Secret": env.PLATEGA_SECRET
        },
        body: JSON.stringify({
          paymentDetails: {
            amount,
            currency: "RUB"
          },
          description: "Заказ KiyanTick Shop",
          return: "https://kiyantickshop-supercell-test.pages.dev/?payment=success",
          failedUrl: "https://kiyantickshop-supercell-test.pages.dev/?payment=failed"

        })
      }
    );

    const data = await paymentResponse.json();

    if (
  !paymentResponse.ok ||
  typeof data.url !== "string" ||
  !data.url.startsWith("https://")
) {
  return Response.json(
    {
      ok: false,
      error: "Platega отклонила запрос",
      providerStatus: paymentResponse.status,
      providerCode: data.code || null,
      providerMessage: data.message || null,
      traceId: data.traceId || null,
      hasPaymentUrl: typeof data.url === "string"
    },
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
      { ok: false, error: "Ошибка обработки заказа" },
      { status: 500 }
    );
  }
}
