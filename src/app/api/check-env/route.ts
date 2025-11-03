import { NextResponse } from 'next/server';

export async function GET() {
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const serviceKeyLength = process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0;
  
  return NextResponse.json({
    hasServiceKey,
    serviceKeyLength,
    // Only show first/last 4 chars for security
    serviceKeyPreview: process.env.SUPABASE_SERVICE_ROLE_KEY 
      ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 4)}...${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(serviceKeyLength - 4)}`
      : 'NOT SET'
  });
}
