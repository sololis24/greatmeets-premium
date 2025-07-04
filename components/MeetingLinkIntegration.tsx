"use client";
import React, { useState, useEffect, useCallback, useRef, RefObject } from "react";
import { Check } from "lucide-react";

/**
 * MeetingLinkIntegration component
 * -------------------------------
 * Handles Zoom + Google‑Meet OAuth flows and writes the resulting join URL
 * back into the parent component via `setMeetingLink`.
 */

type Props = {
  meetingLink: string;
  setMeetingLink: (val: string) => void;
  userToken: string;
  scrollToMeetingLinkRef: RefObject<HTMLDivElement>;
  setJustGeneratedMeetingLink: (val: boolean) => void;
};

export default function MeetingLinkIntegration({
  meetingLink,
  setMeetingLink,
  userToken,
  scrollToMeetingLinkRef,
  setJustGeneratedMeetingLink,
}: Props) {
  /* ───── Local state ───── */
  const [zoomConnected, setZoomConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingZoom, setLoadingZoom] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const popupCloseTimer = useRef<NodeJS.Timeout | null>(null);

  const isZoomLink = meetingLink.includes("zoom.us");
  const isGoogleLink = meetingLink.includes("meet.google.com");

  /* ───── Zoom popup flow ───── */
  const openZoomPopup = useCallback(() => {
    let token = localStorage.getItem("userToken");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("userToken", token);
    }

    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_ZOOM_POPUP_REDIRECT_URI!;

    const authUrl =
      `https://zoom.us/oauth/authorize?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${token}`;

    console.log("[Popup] opening Zoom OAuth:", { authUrl, token });

    // Show spinner immediately
    setLoadingZoom(true);

    // NOTE: **do NOT** use `noopener,noreferrer` – we need `window.opener` alive
    const popup = window.open(authUrl, "zoom-oauth", "width=500,height=700");

    if (!popup) {
      setLoadingZoom(false);
      alert("Please allow pop‑ups for GreatMeets to connect Zoom.");
      return;
    }

    // Clear loading state if user manually closes the popup
    popupCloseTimer.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupCloseTimer.current as NodeJS.Timeout);
        setLoadingZoom(false);
      }
    }, 500);
  }, []);

  /* ───── Listen for popup → postMessage ───── */
  useEffect(() => {
    async function handleMessage(e: MessageEvent) {
      // security guard
      if (e.origin !== window.location.origin) return;
      if (e.data?.source !== "zoom_oauth") return;

      const { code, userToken: tokenFromPopup } = e.data;
      console.log("[Message] received from popup:", { code, tokenFromPopup });

      // We got a message – popup is done, clear spinner / timer
      if (popupCloseTimer.current) {
        clearInterval(popupCloseTimer.current);
        popupCloseTimer.current = null;
      }

      try {
        const res = await fetch("/api/zoom/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state: tokenFromPopup }),
        });
        console.log("[Callback] status:", res.status);
        if (!res.ok) throw new Error("Token exchange failed");

        localStorage.setItem("userToken", tokenFromPopup);
        localStorage.setItem("zoomConnected", "true");
        setZoomConnected(true);

        console.log("[Callback] token stored, creating meeting...");
        await handleCreateZoomMeeting(tokenFromPopup); // awaits so we can clear loader right after
      } catch (err) {
        console.error("❌ Zoom auth exchange error:", err);
        alert("Zoom authorisation failed. Please try again.");
      } finally {
        setLoadingZoom(false);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* Restore previous state on mount */
  useEffect(() => {
    if (localStorage.getItem("zoomConnected") === "true") setZoomConnected(true);
  }, []);

  /* ───── Create Zoom Meeting ───── */
  const handleCreateZoomMeeting = async (tokenOverride?: string) => {
    const tokenToUse = tokenOverride || userToken;
    console.log("[CreateMeeting] using token:", tokenToUse);
    if (!tokenToUse) {
      alert("User token missing.");
      return;
    }

    setLoadingZoom(true);
    try {
      const res = await fetch("/api/zoom/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken: tokenToUse }),
      });
      const data = await res.json();
      console.log("[CreateMeeting] response:", res.status, data);

      if (!res.ok) throw new Error(data.error || "Failed to create Zoom meeting");
      if (!data.join_url) throw new Error("Zoom did not return join_url");

      setMeetingLink(data.join_url);
      setJustGeneratedMeetingLink(true);
      console.log("🎯 Zoom Meeting URL set:", data.join_url);
    } catch (err: any) {
      console.error("❌ Error creating Zoom meeting:", err);
      alert(err.message || "Something went wrong.");
    } finally {
      setLoadingZoom(false);
    }
  };

  /* ──────────────────────── Google‑Meet logic (unchanged) ──────────────── */
  const handleCreateGoogleMeeting = async () => {
    if (!userToken) {
      alert("User token missing.");
      return;
    }
    setLoadingGoogle(true);
    try {
      const res = await fetch("/api/google/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Google Meet link");

      setMeetingLink(data.meetLink);
      setJustGeneratedMeetingLink(true);
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err: any) {
      console.error("❌ Error creating Google Meet:", err);
      alert(err.message || "Something went wrong.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleGoogleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      alert("Missing Google Client ID or Redirect URI");
      return;
    }

    let token = localStorage.getItem("userToken");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("userToken", token);
    }

    const scope = encodeURIComponent("https://www.googleapis.com/auth/calendar.events");
    const googleUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?response_type=code` +
      `&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}&access_type=offline&prompt=consent&state=${token}`;

    window.location.href = googleUrl; // Google flow still uses redirect
  };

  /* ─────────────────────────────── Render ─────────────────────────────── */
  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
      {/* Buttons */}
      <div className="flex flex-wrap gap-4">
        {/* ───────── Zoom Button ───────── */}
        {!isGoogleLink && (
          <div>
            {zoomConnected ? (
              meetingLink ? (
                <button
                  type="button"
                  disabled
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-500 rounded-full font-medium cursor-default border border-gray-300"
                >
                  <Check className="w-4 h-4 text-green-600" />
                  Zoom Link Ready!
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCreateZoomMeeting()}
                  disabled={loadingZoom}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {loadingZoom ? "Creating Zoom Link…" : "Generate Zoom Link"}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={openZoomPopup}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
              >
                {loadingZoom ? "Waiting for Zoom…" : "Connect Zoom"}
              </button>
            )}
          </div>
        )}

        {/* ───────── Google Button (unchanged) ───────── */}
        {!isZoomLink && (
          <div>
            {googleConnected ? (
              <button
                type="button"
                onClick={handleCreateGoogleMeeting}
                disabled={loadingGoogle || isGoogleLink}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition ${
                  isGoogleLink
                    ? "bg-gray-100 text-gray-500 border border-gray-300 cursor-default"
                    : "bg-gradient-to-r from-red-500 to-orange-400 text-white hover:opacity-90"
                }`}
              >
                {loadingGoogle ? (
                  "Creating Google Meet…"
                ) : isGoogleLink ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Google Link Ready!
                  </>
                ) : (
                  "Generate Google Link"
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleConnect}
                className="px-5 py-2.5 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition"
              >
                Create Google Meet
              </button>
            )}
          </div>
        )}
      </div>

      {/* ───────── Meeting link input ───────── */}
      <div ref={scrollToMeetingLinkRef}>
        <input
          type="url"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="Meeting link will appear here…"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        />
      </div>
    </div>
  );
}
