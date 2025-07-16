import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

/**
 * Zoom OAuth callback ‑ exchanges an auth `code` for access + refresh tokens
 * and stores them in Firestore keyed by the caller‑supplied `state` (userToken).
 *
 * Flow:
 * 1. Popup sends { code, state } via postMessage → client → fetch(`/api/zoom/callback`)
 * 2. We POST the code to `https://zoom.us/oauth/token` using Basic (client_id:client_secret)
 * 3. Persist the tokens so we can schedule meetings later.
 */
export async function POST(req: NextRequest) {
  try {
    /* ------------------------------------------------------------------
     * 1) Parse body – should contain `{ code, state }`
     * ----------------------------------------------------------------*/
    const { code, state: userToken } = await req.json();
    if (!code || !userToken) {
      return NextResponse.json(
        { error: "Missing OAuth code or state" },
        { status: 400 }
      );
    }

    /* ------------------------------------------------------------------
     * 2) Exchange code → access / refresh tokens
     * ----------------------------------------------------------------*/
    const redirectUri = process.env.ZOOM_REDIRECT_URI!;
    const clientId = process.env.ZOOM_CLIENT_ID!;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET!;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const zoomRes = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await zoomRes.json();

    if (!zoomRes.ok) {
      console.error("❌ Zoom token exchange failed →", {
        status: zoomRes.status,
        error: data?.error,
        reason: data?.reason,
        full: JSON.stringify(data),
        sent_client_id: clientId,
        sent_redirect_uri: redirectUri,
      });
      return NextResponse.json({ error: data }, { status: 500 });
    }

    /* ------------------------------------------------------------------
     * 3) Persist tokens in Firestore (collection: zoomTokens)
     * ----------------------------------------------------------------*/
    const now = Date.now();
    const expiresAt = now + data.expires_in * 1000; // expires_in is in seconds

    await setDoc(doc(db, "zoomTokens", userToken), {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      expires_at: expiresAt,
      token_type: data.token_type,
      createdAt: new Date(now).toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Zoom callback error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
