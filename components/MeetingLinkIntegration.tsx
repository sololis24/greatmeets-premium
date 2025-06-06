'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Check } from 'lucide-react';

type MeetingLinkIntegrationProps = {
  meetingLink: string;
  setMeetingLink: (val: string) => void;
  userToken: string;
  scrollToMeetingLinkRef: React.RefObject<HTMLDivElement>;
  setJustGeneratedMeetingLink: (val: boolean) => void; // ✅ Add this line
};

export default function MeetingLinkIntegration({
  meetingLink,
  setMeetingLink,
  userToken,
  scrollToMeetingLinkRef,
  setJustGeneratedMeetingLink, // ✅ Add this
}: MeetingLinkIntegrationProps) {

  const [zoomConnected, setZoomConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loadingZoom, setLoadingZoom] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const hasTriggeredGoogleAutoGen = useRef(false);
  const isZoomLink = meetingLink.includes('zoom.us');
  const storedUserToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : '';
  const isGoogleLink = meetingLink.includes('meet.google.com');
  const handleCreateZoomMeeting = async () => {
    if (!userToken) {
      alert('User token missing.');
      return;
    }

    setLoadingZoom(true);
    try {
      const res = await fetch('/api/zoom/create-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Zoom meeting');

      if (data.join_url) {
        setMeetingLink(data.join_url);
        setJustGeneratedMeetingLink(true);
        console.log('[✅ Zoom link set]', data.join_url);
      } else {
        throw new Error('Missing join_url from Zoom API');
      }
    } catch (err: any) {
      console.error('❌ Error creating Zoom meeting:', err);
      alert(err.message || 'Something went wrong.');
    } finally {
      setLoadingZoom(false);
    }
  };

  const handleCreateGoogleMeeting = async () => {
    if (!userToken) {
      alert('User token missing.');
      return;
    }
  
    setLoadingGoogle(true);
    try {
      const res = await fetch('/api/google/create-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userToken }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create Google Meet link');
  
      setMeetingLink(data.meetLink);
      setJustGeneratedMeetingLink(true);
      console.log('[✅ Google Meet link set]', data.meetLink);
  
      // 🧼 Clean up ?google=connected&token=... from URL
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      console.error('❌ Error creating Google Meet:', err);
      alert(err.message || 'Something went wrong.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zoomParam = params.get('zoom');
    const googleParam = params.get('google'); // ✅ new
    const token = userToken;

    if (window.location.pathname === '/' && !zoomParam) {
      localStorage.removeItem('zoomConnected');
      setZoomConnected(false);
      setMeetingLink('');
    }

    if (zoomParam === 'connected' && token) {
      fetch(`/api/zoom/token-exists?userToken=${token}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.exists) {
            localStorage.setItem('zoomConnected', 'true');
            setZoomConnected(true);
            handleCreateZoomMeeting();
          } else {
            localStorage.removeItem('zoomConnected');
            setZoomConnected(false);
          }
        });
    } else if (localStorage.getItem('zoomConnected') === 'true') {
      setZoomConnected(true);
    }

    // ✅ Google logic
  
    if (
      googleParam === 'connected' &&
      token &&
      !hasTriggeredGoogleAutoGen.current
    ) {
      hasTriggeredGoogleAutoGen.current = true;
      setGoogleConnected(true);
      handleCreateGoogleMeeting();
    }
    

  }, [userToken]);

  const handleZoomConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
    if (!clientId) {
      alert('Zoom Client ID is missing. Check your .env.local file.');
      return;
    }

    let token = localStorage.getItem('userToken');
    if (!token) {
      token = crypto.randomUUID(); // ✅ this generates the token once
      localStorage.setItem('userToken', token);
    }
    
    const redirectUri = encodeURIComponent(process.env.ZOOM_REDIRECT_URI || '');
    const zoomUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${token}`;
    
    console.log('🌐 Zoom OAuth redirect (with token):', token);
    window.location.href = zoomUrl;
    
  };

  console.log('🧪 ENV:', process.env);
console.log('🧪 GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const handleGoogleConnect = () => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    alert('Missing Google Client ID or Redirect URI');
    return;
  }

  let token = localStorage.getItem('userToken');
  if (!token) {
    token = crypto.randomUUID(); // ✅ this generates the token once
    localStorage.setItem('userToken', token);
  }

  const encodedRedirectUri = encodeURIComponent(redirectUri);
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.events');

  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&access_type=offline&prompt=consent&state=${token}`;

  window.location.href = googleUrl;
};

  return (

<div className="space-y-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-lg">
  <div className="flex flex-wrap gap-4">
    {/* Zoom Button */}
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
              onClick={handleCreateZoomMeeting}
              disabled={loadingZoom}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loadingZoom ? 'Creating Zoom Link...' : 'Generate Zoom Link'}
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={handleZoomConnect}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition"
          >
            Connect Zoom
          </button>
        )}
      </div>
    )}

    {/* Google Button */}
    {!isZoomLink && (
      <div>
        {googleConnected ? (
          <button
            type="button"
            onClick={handleCreateGoogleMeeting}
            disabled={loadingGoogle || isGoogleLink}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition ${
              isGoogleLink
                ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-default'
                : 'bg-gradient-to-r from-red-500 to-orange-400 text-white hover:opacity-90'
            }`}
          >
            {loadingGoogle ? (
              'Creating Google Meet...'
            ) : isGoogleLink ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Google Link Ready!
              </>
            ) : (
              'Generate Google Link'
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

  {/* Input */}
  <div ref={scrollToMeetingLinkRef}>
    <input
      type="url"
      value={meetingLink}
      onChange={(e) => setMeetingLink(e.target.value)}
      placeholder="Meeting link will appear here..."
      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
    />
  </div>
</div>
  );
}
