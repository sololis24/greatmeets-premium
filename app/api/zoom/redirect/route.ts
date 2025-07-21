import { NextRequest, NextResponse } from 'next/server';

const allowedZoomHosts = [
  'https://us04web.zoom.us/',
  'https://us05web.zoom.us/',
  'https://us06web.zoom.us/',
  'https://zoom.us/'
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zoomURL = searchParams.get('target');

  const isValidZoomUrl = allowedZoomHosts.some(prefix => zoomURL?.startsWith(prefix));

  if (!zoomURL || !isValidZoomUrl) {
    return new NextResponse('Invalid or missing Zoom link.', { status: 400 });
  }

  return NextResponse.redirect(zoomURL, 302);
}
