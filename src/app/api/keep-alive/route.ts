import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Vercel Cron等の自動実行用ため、キャッシュを無効化
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 軽いクエリを発行してSupabaseの活動を記録し、休眠（Pause）を防ぐ
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Keep-alive ping failed:', error.message);
      return NextResponse.json(
        { status: 'error', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase ping successful',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
