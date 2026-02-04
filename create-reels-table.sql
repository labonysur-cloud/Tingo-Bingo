-- Create Reels Table
create table if not exists public.reels (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  video_url text not null,
  thumbnail_url text,
  caption text,
  duration float, -- Duration in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reels enable row level security;

-- Policies
create policy "Public reels are viewable by everyone"
  on public.reels for select
  using ( true );

create policy "Users can insert their own reels"
  on public.reels for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own reels"
  on public.reels for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own reels"
  on public.reels for delete
  using ( auth.uid() = user_id );

-- Realtime
alter publication supabase_realtime add table public.reels;
