"use client";
import React, { useState, useEffect, useCallback, useRef, RefObject } from "react";
import { Check } from "lucide-react";

type Props = {
  meetingLink: string;
  setMeetingLink: (val: string) => void;
  userToken: string;
  setJustGeneratedMeetingLink: (val: boolean) => void;
  scrollToMeetingLinkRef: RefObject<HTMLDivElement | null>;
};

export default function MeetingLinkIntegration({
  meetingLink,
  setMeetingLink,
  userToken: initialUserToken,
  scrollToMeetingLinkRef,
  setJustGeneratedMeetingLink,
}: Props) {
  const [zoomConnected, setZoomConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingZoom, setLoadingZoom] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const popupCloseTimer = useRef<NodeJS.Timeout | null>(null);

  const getUserToken = () => localStorage.getItem("userToken") || initialUserToken;

  const openZoomPopup = useCallback(() => {
    let token = localStorage.getItem("userToken");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("userToken", token);
    }

    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID!;
    const redirectUri = process.env.NEXT_PUBLIC_ZOOM_POPUP_REDIRECT_URI!;
    const authUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${token}`;

    setLoadingZoom(true);
    const popup = window.open(authUrl, "zoom-oauth", "width=500,height=700");

    if (!popup) {
      setLoadingZoom(false);
      alert("Please allow pop‑ups for GreatMeets to connect Zoom.");
      return;
    }

    popupCloseTimer.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupCloseTimer.current as NodeJS.Timeout);
        setLoadingZoom(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    async function handleMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin || e.data?.source !== "zoom_oauth") return;

      const { code, userToken: tokenFromPopup } = e.data;

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

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error_description || "Token exchange failed");

        localStorage.setItem("userToken", tokenFromPopup);
        localStorage.setItem("zoomConnected", "true");
        setZoomConnected(true);

        await handleCreateZoomMeeting(tokenFromPopup);
      } catch (err) {
        console.error("❌ Zoom auth exchange error:", err);
        alert("Zoom authorization failed. Please try again.");
      } finally {
        setLoadingZoom(false);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const token = getUserToken();
    if (!token) return;

    const checkZoomTokenExists = async () => {
      try {
        const res = await fetch("/api/zoom/token-exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userToken: token }),
        });
        const data = await res.json();

        if (res.ok && data.exists) {
          localStorage.setItem("zoomConnected", "true");
          setZoomConnected(true);
        } else {
          localStorage.removeItem("zoomConnected");
          setZoomConnected(false);
        }
      } catch (err) {
        console.error("❌ Error checking Zoom token existence:", err);
        setZoomConnected(false);
      }
    };

    checkZoomTokenExists();
  }, []);

  const handleCreateZoomMeeting = async (tokenOverride?: string) => {
    const token = tokenOverride || getUserToken();
    if (!token) {
      alert("Zoom token not found.");
      return;
    }

    setLoadingZoom(true);
    try {
      const res = await fetch("/api/zoom/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken: token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Zoom meeting");
      if (!data.join_url) throw new Error("Zoom did not return join_url");

      setMeetingLink(data.join_url);
      setJustGeneratedMeetingLink(true);
    } catch (err: any) {
      console.error("❌ Error creating Zoom meeting:", err);
      alert(err.message || "Something went wrong.");
    } finally {
      setLoadingZoom(false);
    }
  };

  const handleCreateGoogleMeeting = async () => {
    const token = getUserToken();
    if (!token) {
      alert("User token missing.");
      return;
    }

    setLoadingGoogle(true);
    try {
      const res = await fetch("/api/google/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userToken: token }),
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
    const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&access_type=offline&prompt=consent&state=${token}`;

    window.location.href = googleUrl;
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
      <div className="flex flex-wrap gap-4">
        {zoomConnected ? (
          <button
            type="button"
            onClick={() => handleCreateZoomMeeting()}
            disabled={loadingZoom}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loadingZoom ? "Creating Zoom Link…" : "Generate Zoom Link"}
          </button>
        ) : (
          <button
            type="button"
            onClick={openZoomPopup}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
          >
            {loadingZoom ? "Waiting for Zoom…" : "Connect Zoom"}
          </button>
        )}

        {!meetingLink.includes("meet.google.com") && (
          googleConnected ? (
            <button
              type="button"
              onClick={handleCreateGoogleMeeting}
              disabled={loadingGoogle}
              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-400 text-white rounded-full font-semibold hover:opacity-90 transition"
            >
              {loadingGoogle ? "Creating Google Meet…" : "Generate Google Link"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="px-5 py-2.5 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition"
            >
              Create Google Meet
            </button>
          )
        )}
      </div>

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
