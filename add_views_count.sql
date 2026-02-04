-- Add views_count to reels table
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Function to reliably increment view count (RPC)
-- This avoids race conditions and RLS issues for simple counters
create or replace function increment_view_count(row_id uuid)
returns void as $$
begin
  update public.reels
  set views_count = views_count + 1
  where id = row_id;
end;
$$ language plpgsql security definer;
