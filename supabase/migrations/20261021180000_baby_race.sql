-- Baby Race schema. Paste this whole file into the Supabase SQL editor and run it once.
-- Running it again deletes every vote. Do that only before guests arrive.
--
-- After it succeeds, set a host password (16+ letters and numbers, no quotes)
-- in the SQL editor. Do not commit that password.
--
--   update public.admin_config
--   set secret = 'replace-with-your-long-password'
--   where id = 1;

drop function if exists public.cast_vote(uuid, text, text);
drop function if exists public.admin_action(text, text);
drop function if exists public.admin_votes(text);
drop function if exists public.my_vote(uuid);
drop function if exists public.assert_admin(text);

drop table if exists public.votes;
drop table if exists public.game;
drop table if exists public.game_state;
drop table if exists public.admin_config;

create table public.admin_config (
  id int primary key check (id = 1),
  secret text not null check (char_length(secret) >= 12)
);

create table public.game_state (
  id int primary key check (id = 1),
  voting_open boolean not null default true,
  countdown_active boolean not null default false,
  countdown_started_at timestamptz,
  reveal_state text not null default 'race' check (reveal_state in ('race', 'countdown', 'prediction', 'actual')),
  prediction_winner text check (prediction_winner in ('girl', 'boy', 'tie')),
  prediction_girl_votes int not null default 0 check (prediction_girl_votes >= 0),
  prediction_boy_votes int not null default 0 check (prediction_boy_votes >= 0),
  actual_gender text check (actual_gender in ('girl', 'boy')),
  girl_votes int not null default 0 check (girl_votes >= 0),
  boy_votes int not null default 0 check (boy_votes >= 0),
  last_team text check (last_team in ('girl', 'boy')),
  last_vote_at timestamptz,
  vote_seq bigint not null default 0,
  updated_at timestamptz not null default pg_catalog.now()
);

create table public.votes (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  guest_name text not null check (char_length(guest_name) between 1 and 40),
  voter_id uuid not null unique,
  team text not null check (team in ('girl', 'boy')),
  created_at timestamptz not null default pg_catalog.now()
);

create index votes_created_at_idx on public.votes (created_at desc);

insert into public.admin_config (id, secret)
values (1, 'PASTE_YOUR_LONG_SECRET_HERE');

insert into public.game_state (id) values (1);

alter table public.admin_config enable row level security;
alter table public.game_state enable row level security;
alter table public.votes enable row level security;

revoke all on table public.admin_config from public, anon, authenticated;
revoke all on table public.votes from public, anon, authenticated;
revoke all on table public.game_state from public, anon, authenticated;
grant select on table public.game_state to anon, authenticated;

create policy "public read game state"
  on public.game_state
  for select
  to anon, authenticated
  using (true);

-- No policies on votes or admin_config: guests cannot read names or the host password.

create or replace function public.assert_admin(p_secret text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select secret into v_secret from public.admin_config where id = 1;
  if v_secret is null
     or char_length(v_secret) < 12
     or v_secret = 'PASTE_YOUR_LONG_SECRET_HERE' then
    raise exception 'Admin secret is not ready. Update admin_config in the Supabase SQL editor.';
  end if;
  if p_secret is distinct from v_secret then
    raise exception 'Invalid admin secret';
  end if;
end;
$$;

create or replace function public.cast_vote(p_voter_id uuid, p_name text, p_team text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.game_state;
  v_name text;
  v_existing_name text;
  v_existing_team text;
begin
  if p_voter_id is null then
    raise exception 'Invalid voter';
  end if;
  if p_team not in ('girl', 'boy') then
    raise exception 'Invalid team';
  end if;

  select * into g from public.game_state where id = 1 for update;
  if not found then
    raise exception 'Game is not set up';
  end if;
  if not g.voting_open then
    raise exception 'Voting is closed';
  end if;

  v_name := pg_catalog.btrim(coalesce(p_name, ''));
  v_name := pg_catalog.regexp_replace(v_name, '[[:cntrl:]]', '', 'g');
  v_name := pg_catalog.regexp_replace(v_name, '[[:space:]]+', ' ', 'g');

  if char_length(v_name) < 1 or char_length(v_name) > 40 then
    raise exception 'Name must be 1 to 40 characters';
  end if;

  select v.guest_name, v.team
    into v_existing_name, v_existing_team
  from public.votes v
  where v.voter_id = p_voter_id;

  if found then
    return pg_catalog.jsonb_build_object(
      'guest_name', v_existing_name,
      'team', v_existing_team,
      'already_voted', true
    );
  end if;

  begin
    insert into public.votes (guest_name, voter_id, team)
    values (v_name, p_voter_id, p_team);
  exception
    when unique_violation then
      select v.guest_name, v.team
        into v_existing_name, v_existing_team
      from public.votes v
      where v.voter_id = p_voter_id;
      return pg_catalog.jsonb_build_object(
        'guest_name', v_existing_name,
        'team', v_existing_team,
        'already_voted', true
      );
  end;

  update public.game_state
  set
    girl_votes = girl_votes + case when p_team = 'girl' then 1 else 0 end,
    boy_votes = boy_votes + case when p_team = 'boy' then 1 else 0 end,
    last_team = p_team,
    last_vote_at = pg_catalog.now(),
    vote_seq = vote_seq + 1,
    updated_at = pg_catalog.now()
  where id = 1;

  return pg_catalog.jsonb_build_object(
    'guest_name', v_name,
    'team', p_team,
    'already_voted', false
  );
end;
$$;

create or replace function public.my_vote(p_voter_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object('guest_name', v.guest_name, 'team', v.team)
  from public.votes v
  where v.voter_id = p_voter_id;
$$;

create or replace function public.admin_votes(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_admin(p_secret);
  return coalesce(
    (
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', v.id,
          'guest_name', v.guest_name,
          'team', v.team,
          'created_at', v.created_at
        )
        order by v.created_at desc
      )
      from (
        select id, guest_name, team, created_at
        from public.votes
        order by created_at desc
        limit 500
      ) v
    ),
    '[]'::jsonb
  );
end;
$$;

create or replace function public.admin_action(p_secret text, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  g public.game_state;
  v_winner text;
begin
  perform public.assert_admin(p_secret);

  select * into g from public.game_state where id = 1 for update;
  if not found then
    raise exception 'Game is not set up';
  end if;

  if g.girl_votes > g.boy_votes then
    v_winner := 'girl';
  elsif g.boy_votes > g.girl_votes then
    v_winner := 'boy';
  else
    v_winner := 'tie';
  end if;

  if p_action = 'lock' then
    update public.game_state
    set voting_open = false, updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'unlock' then
    update public.game_state
    set voting_open = true, updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'reset' then
    delete from public.votes;
    update public.game_state
    set
      voting_open = true,
      countdown_active = false,
      countdown_started_at = null,
      reveal_state = 'race',
      prediction_winner = null,
      prediction_girl_votes = 0,
      prediction_boy_votes = 0,
      actual_gender = null,
      girl_votes = 0,
      boy_votes = 0,
      last_team = null,
      last_vote_at = null,
      vote_seq = 0,
      updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'countdown' then
    update public.game_state
    set
      voting_open = false,
      countdown_active = true,
      countdown_started_at = pg_catalog.now(),
      reveal_state = 'countdown',
      prediction_winner = v_winner,
      prediction_girl_votes = g.girl_votes,
      prediction_boy_votes = g.boy_votes,
      updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'celebrate' then
    update public.game_state
    set
      voting_open = false,
      countdown_active = false,
      reveal_state = 'prediction',
      prediction_winner = v_winner,
      prediction_girl_votes = g.girl_votes,
      prediction_boy_votes = g.boy_votes,
      updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'race' then
    update public.game_state
    set
      countdown_active = false,
      reveal_state = 'race',
      updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'actual_girl' then
    update public.game_state
    set
      voting_open = false,
      countdown_active = false,
      reveal_state = 'actual',
      actual_gender = 'girl',
      updated_at = pg_catalog.now()
    where id = 1;
  elsif p_action = 'actual_boy' then
    update public.game_state
    set
      voting_open = false,
      countdown_active = false,
      reveal_state = 'actual',
      actual_gender = 'boy',
      updated_at = pg_catalog.now()
    where id = 1;
  else
    raise exception 'Unknown action';
  end if;

  return (select pg_catalog.to_jsonb(s) from public.game_state s where s.id = 1);
end;
$$;

revoke all on function public.assert_admin(text) from public, anon, authenticated;
revoke all on function public.cast_vote(uuid, text, text) from public;
revoke all on function public.my_vote(uuid) from public;
revoke all on function public.admin_votes(text) from public;
revoke all on function public.admin_action(text, text) from public;

grant execute on function public.cast_vote(uuid, text, text) to anon, authenticated;
grant execute on function public.my_vote(uuid) to anon, authenticated;
grant execute on function public.admin_votes(text) to anon, authenticated;
grant execute on function public.admin_action(text, text) to anon, authenticated;

alter table public.game_state replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.game_state;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'supabase_realtime publication was not found. Enable Realtime for game_state in the dashboard.';
end
$$;
