export async function onRequestGet() {
  return Response.json({
    ok: true,
    message: "Payment API is running"
  });
}

