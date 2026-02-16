-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Virtual Pets Table
-- ==========================================
create table if not exists virtual_pets (
    id uuid primary key default uuid_generate_v4(),
    user_id text references users(id) on delete cascade not null,
    name text not null,
    type text not null check (type in ('cat', 'dog', 'rabbit', 'bird')),
    
    -- Vitals (0-100)
    hunger integer default 50 check (hunger between 0 and 100),
    happiness integer default 50 check (happiness between 0 and 100),
    energy integer default 100 check (energy between 0 and 100),
    health integer default 100 check (health between 0 and 100),
    
    -- Economy & Progression
    coins integer default 100,
    stage text default 'baby' check (stage in ('baby', 'child', 'adult')),
    experience integer default 0,
    
    -- Timestamps for decay mechanics
    last_fed_at timestamptz default now(),
    last_played_at timestamptz default now(),
    last_slept_at timestamptz default now(),
    
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- ==========================================
-- 2. Pet Rooms (Customization)
-- ==========================================
create table if not exists pet_rooms (
    id uuid primary key default uuid_generate_v4(),
    pet_id uuid references virtual_pets(id) on delete cascade not null,
    background_url text default 'https://res.cloudinary.com/danhvu5xb/image/upload/v1/tingo-bingo/rooms/default_room',
    furniture jsonb default '{}'::jsonb, -- Store furniture positions/types
    
    created_at timestamptz default now()
);

-- ==========================================
-- 3. Playdates (Social)
-- ==========================================
create table if not exists pet_playdates (
    id uuid primary key default uuid_generate_v4(),
    host_pet_id uuid references virtual_pets(id) on delete cascade not null,
    guest_pet_id uuid references virtual_pets(id) on delete cascade not null,
    status text default 'pending' check (status in ('pending', 'active', 'completed')),
    
    started_at timestamptz default now(),
    ended_at timestamptz
);

-- ==========================================
-- 4. RLS Policies
-- ==========================================
alter table virtual_pets enable row level security;
alter table pet_rooms enable row level security;
alter table pet_playdates enable row level security;

-- Pets: Permissive policies (App handles security)
create policy "Public pets are viewable by everyone" 
on virtual_pets for select using (true);

create policy "Users can insert their own pet" 
on virtual_pets for insert with check (true);

create policy "Users can update their own pet" 
on virtual_pets for update using (true);

create policy "Users can delete their own pet" 
on virtual_pets for delete using (true);

-- Rooms: Permissive policies
create policy "Rooms are viewable by everyone" 
on pet_rooms for select using (true);

create policy "Users can update their own pet room" 
on pet_rooms for update using (true);

create policy "Users can insert their own pet room" 
on pet_rooms for insert with check (true);

-- Stats bucket for fast leaderboard (Optional)
create or replace view pet_leaderboard as
select 
    p.id, 
    p.name, 
    p.type, 
    p.stage, 
    p.coins, 
    u.name as owner_name, 
    u.avatar as owner_avatar
from virtual_pets p
join users u on p.user_id = u.id
order by p.experience desc, p.coins desc;

-- Function: Playdate
-- Updates both pets' happiness
create or replace function start_playdate(host_id uuid, guest_id uuid)
returns void as $$
begin
    insert into pet_playdates (host_pet_id, guest_pet_id, status)
    values (host_id, guest_id, 'active');
    
    -- Boost happiness for both
    update virtual_pets set happiness = LEAST(happiness + 10, 100), coins = coins + 5 where id = host_id;
    update virtual_pets set happiness = LEAST(happiness + 10, 100), coins = coins + 5 where id = guest_id;
end;
$$ language plpgsql security definer;
