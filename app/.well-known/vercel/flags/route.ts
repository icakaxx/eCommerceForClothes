import { NextResponse } from 'next/server';

/**
 * Flags Discovery Endpoint for Vercel Toolbar / Web Analytics.
 * @see https://vercel.com/docs/flags/flags-explorer/reference#discovery-endpoint
 */
export async function GET() {
  return NextResponse.json({
    definitions: {
      'store-language': {
        description: 'Storefront UI language (BG / EN toggle)',
        options: [
          { value: 'bg', label: 'Bulgarian' },
          { value: 'en', label: 'English' },
        ],
      },
      'analytics-consent': {
        description: 'Cookie / analytics consent banner state',
        options: [
          { value: 'accepted', label: 'Accepted' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'not-asked', label: 'Not asked' },
        ],
      },
      'store-theme': {
        description: 'Active ModaBox color theme',
        options: [
          { value: 'minimalist', label: 'ModaBox' },
          { value: 'dark', label: 'Dark' },
        ],
      },
    },
  });
}
