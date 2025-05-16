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
  


  console.log('🌍 userToken (prop):', userToken);
console.log('🗂️ localStorage token:', localStorage.getItem('userToken'));


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
    
    const redirectUri = encodeURIComponent('https://96bb-84-86-92-1.ngrok-free.app/api/zoom/callback');
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
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap">
       
       
        {/* Zoom */}
{!isGoogleLink && (
  <div className="flex items-center gap-2">
    {zoomConnected ? (
      meetingLink ? (
        <button
          type="button"
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-default"
        >
          <Check className="w-4 h-4 text-green-600" />
          Zoom Link Generated
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCreateZoomMeeting}
          disabled={loadingZoom}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {loadingZoom ? 'Creating Zoom Link...' : 'Generate Zoom Link'}
        </button>
      )
    ) : (
      <button
        type="button"
        onClick={handleZoomConnect}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Connect Zoom
      </button>
    )}
  </div>
)}



{!isZoomLink && (
  <div className="flex items-center gap-2">
    {googleConnected ? (
      <button
        type="button"
        onClick={handleCreateGoogleMeeting}
        disabled={loadingGoogle || isGoogleLink}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
          isGoogleLink
            ? 'bg-gray-300 text-gray-600 cursor-default'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {loadingGoogle ? (
          'Creating Google Meet...'
        ) : isGoogleLink ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            Google Link Created
          </>
        ) : (
          'Generate Google Link'
        )}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleGoogleConnect}
        className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition"
      >
        Create Google Meet
      </button>
    )}
  </div>
)}


      </div>

      <div ref={scrollToMeetingLinkRef}>
        <input
          type="url"
          value={meetingLink}
          onChange={(e) => setMeetingLink(e.target.value)}
          placeholder="Meeting link will appear here..."
          className="w-full border border-gray-300 rounded-xl px-4 py-2 text-base shadow-sm focus:ring-2 focus:ring-indigo-400"
        />
      </div>
    </div>
  );
}
