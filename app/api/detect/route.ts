function isErrorWithMessage(e: unknown): e is { message?: string } {
  return typeof e === 'object' && e !== null && 'message' in e;
}
import axios from "axios";

export const runtime = "nodejs"; // ensure server runtime

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const imageUrl = form.get("imageUrl") as string | null;

    if (!file && !imageUrl) {
      return new Response(JSON.stringify({ error: "Provide file or imageUrl" }), { status: 400 });
    }

    // If a file was uploaded: convert to base64 (data URL form)
    let payload: string | undefined;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      payload = `data:${file.type};base64,${base64}`;
    }

    const res = await axios({
      method: "POST",
      url: process.env.ROBOFLOW_MODEL_URL!,
      params: {
        api_key: process.env.ROBOFLOW_API_KEY!,
        ...(imageUrl ? { image: imageUrl } : {})
      },
      data: payload, // only for local file case
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    return new Response(JSON.stringify(res.data), { status: 200 });
  } catch (e: unknown) {
  return new Response(JSON.stringify({ error: isErrorWithMessage(e) && typeof e.message === 'string' ? e.message : String(e) }), { status: 500 });
  }
}
