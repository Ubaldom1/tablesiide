const respond = (data, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin) return respond({ error: "Please submit from this website." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json")) return respond({ error: "Invalid request." }, 415);
  try {
    const raw = await request.text();
    if (raw.length > 4096) return respond({ error: "Please shorten your response." }, 413);
    const data = JSON.parse(raw);
    if (data.website) return respond({ ok: true });
    const clean = (key, max) => typeof data[key] === "string" ? data[key].trim().slice(0, max) : "";
    const email = clean("email", 254).toLowerCase();
    const name = clean("name", 100);
    const restaurant = clean("restaurant", 150);
    const city = clean("city", 100);
    if (!name || !restaurant || !city || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || data.consent !== true)
      return respond({ error: "Please complete the required fields and consent checkbox." }, 400);
    const number = (value, max) => value === "" || value == null ? null :
      (Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= max ? Number(value) : NaN);
    const quantity = number(data.quantity, 10000);
    const price = number(data.price, 100000);
    if (Number.isNaN(quantity) || Number.isNaN(price))
      return respond({ error: "Please enter a valid whole-number quantity or price." }, 400);
    const finishes = data.finishes ?? [];
    if (!Array.isArray(finishes) || finishes.length > 4 || finishes.some(f => !["Matte Black", "Gloss Black", "White", "Polished Nickel"].includes(f)))
      return respond({ error: "Please select a listed finish." }, 400);
    if (!process.env.RESEND_API_KEY) return respond({ error: "The form is being set up. Please email support@tablesiide.com for now." }, 503);
    const result = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Tablesiide <support@tablesiide.com>",
        to: ["support@tablesiide.com"],
        reply_to: email,
        subject: "New Tablesiide restaurant inquiry",
        text: [`Name: ${name}`, `Email: ${email}`, `Restaurant: ${restaurant}`, `City: ${city}`,
          `Quantity: ${quantity ?? "Not provided"}`, `Suggested price (USD): ${price ?? "Not provided"}`,
          `Finishes: ${[...new Set(finishes)].join(", ") || "Not provided"}`].join("\n")
      })
    });
    if (!result.ok) {
      console.error("Resend failed", result.status);
      return respond({ error: "We could not send your interest. Please email support@tablesiide.com." }, 502);
    }
    return respond({ ok: true });
  } catch (error) {
    console.error("Interest form failed", error);
    return respond({ error: "We could not send your interest. Please try again." }, 500);
  }
}
