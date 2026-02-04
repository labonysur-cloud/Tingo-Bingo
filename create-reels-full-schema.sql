-- ==========================================
-- SUPER REELS SCHEMA (Complete V2)
-- ==========================================

-- 1. Create Reels Table (Enhanced)
create table if not exists public.reels (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete cascade not null, -- Changed to text to match users table
  video_url text not null,
  thumbnail_url text,
  caption text,
  duration float,
  
  -- Counters (for performance)
  likes_count integer default 0,
  comments_count integer default 0,
  saves_count integer default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Reel Likes Table
create table if not exists public.reel_likes (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete cascade not null,
  reel_id uuid references public.reels(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, reel_id) -- Prevent duplicate likes
);

-- 3. Create Reel Comments Table (Threaded)
create table if not exists public.reel_comments (
  id uuid default gen_random_uuid() primary key,
  reel_id uuid references public.reels(id) on delete cascade not null,
  user_id text references public.users(id) on delete cascade not null,
  content text not null,
  
  -- Threading support
  parent_id uuid references public.reel_comments(id) on delete cascade, 
  
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Reel Saves (Moodboard) Table
create table if not exists public.reel_saves (
  id uuid default gen_random_uuid() primary key,
  user_id text references public.users(id) on delete cascade not null,
  reel_id uuid references public.reels(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, reel_id)
);


-- ==========================================
-- RLS POLICIES (Security)
-- ==========================================

-- Enable RLS
alter table public.reels enable row level security;
alter table public.reel_likes enable row level security;
alter table public.reel_comments enable row level security;
alter table public.reel_saves enable row level security;

-- Reels Policies
create policy "Public reels are viewable by everyone" on public.reels for select using ( true );
create policy "Users can insert their own reels" on public.reels for insert with check ( true );
create policy "Users can update their own reels" on public.reels for update using ( true );
create policy "Users can delete their own reels" on public.reels for delete using ( true );

-- Likes Policies
create policy "Public likes are viewable" on public.reel_likes for select using ( true );
create policy "Users can like" on public.reel_likes for insert with check ( auth.uid()::text = user_id );
create policy "Users can unlike" on public.reel_likes for delete using ( auth.uid()::text = user_id );

-- Comments Policies
create policy "Public comments are viewable" on public.reel_comments for select using ( true );
create policy "Users can comment" on public.reel_comments for insert with check ( auth.uid()::text = user_id );
create policy "Users can delete own comments" on public.reel_comments for delete using ( auth.uid()::text = user_id );

-- Saves Policies
create policy "Users can view own saves" on public.reel_saves for select using ( auth.uid()::text = user_id );
create policy "Users can save" on public.reel_saves for insert with check ( auth.uid()::text = user_id );
create policy "Users can unsave" on public.reel_saves for delete using ( auth.uid()::text = user_id );


-- ==========================================
-- REALTIME SETUP
-- ==========================================
alter publication supabase_realtime add table public.reels;
alter publication supabase_realtime add table public.reel_likes;
alter publication supabase_realtime add table public.reel_comments;

-- Note: Triggers for counter updates (likes_count, etc.) are recommended for a "perfect" system 
-- but often handled optimistically in frontend or via simple increment calls for MVPs. 
-- For a robust system, we should add triggers.

-- Trigger Function: Update Reel Counters
create or replace function update_reel_counters()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    if (TG_TABLE_NAME = 'reel_likes') then
      update public.reels set likes_count = likes_count + 1 where id = new.reel_id;
    elsif (TG_TABLE_NAME = 'reel_comments') then
      update public.reels set comments_count = comments_count + 1 where id = new.reel_id;
    elsif (TG_TABLE_NAME = 'reel_saves') then
      update public.reels set saves_count = saves_count + 1 where id = new.reel_id;
    end if;
    return new;
  elsif (TG_OP = 'DELETE') then
    if (TG_TABLE_NAME = 'reel_likes') then
      update public.reels set likes_count = likes_count - 1 where id = old.reel_id;
    elsif (TG_TABLE_NAME = 'reel_comments') then
      update public.reels set comments_count = comments_count - 1 where id = old.reel_id;
    elsif (TG_TABLE_NAME = 'reel_saves') then
      update public.reels set saves_count = saves_count - 1 where id = old.reel_id;
    end if;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Apply Triggers
drop trigger if exists on_reel_like on public.reel_likes;
create trigger on_reel_like after insert or delete on public.reel_likes
  for each row execute function update_reel_counters();

drop trigger if exists on_reel_comment on public.reel_comments;
create trigger on_reel_comment after insert or delete on public.reel_comments
  for each row execute function update_reel_counters();

drop trigger if exists on_reel_save on public.reel_saves;
create trigger on_reel_save after insert or delete on public.reel_saves
  for each row execute function update_reel_counters();
