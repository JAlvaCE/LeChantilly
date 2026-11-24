-- Proposed migration for a dedicated Supabase project. Not executed. No owner provisioned.
-- Do not run against unrelated databases. Apply in staging, run RLS tests, approve before production.
begin;
create table public.lc_owner_members (
 user_id uuid primary key references auth.users(id) on delete restrict,
 active boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.lc_owner_members enable row level security;
alter table public.lc_owner_members force row level security;
revoke all on public.lc_owner_members from public, anon, authenticated;
grant select on public.lc_owner_members to authenticated;
create policy lc_member_self_read on public.lc_owner_members for select to authenticated
 using (user_id=(select auth.uid()) and active and (select auth.jwt()->>'aal')='aal2');

create table public.lc_recipe_drafts (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.lc_owner_members(user_id) on delete restrict,
 title text not null check (char_length(btrim(title)) between 1 and 120),
 unit text not null check (unit in ('pieza','torta','caja','porción')),
 gross_yield integer not null check (gross_yield between 1 and 10000),
 waste_units integer not null default 0 check (waste_units>=0 and waste_units<gross_yield),
 ingredients_cost_cop bigint not null check (ingredients_cost_cop between 0 and 100000000),
 active_minutes integer not null check (active_minutes between 0 and 1440),
 status text not null default 'draft' check(status in ('draft','archived')),
 revision integer not null default 1 check(revision>=1),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.lc_recipe_drafts enable row level security;
alter table public.lc_recipe_drafts force row level security;
revoke all on public.lc_recipe_drafts from public, anon, authenticated;
grant select on public.lc_recipe_drafts to authenticated;
grant insert (title,unit,gross_yield,waste_units,ingredients_cost_cop,active_minutes) on public.lc_recipe_drafts to authenticated;
grant update (title,unit,gross_yield,waste_units,ingredients_cost_cop,active_minutes,status) on public.lc_recipe_drafts to authenticated;
create policy lc_recipe_owner on public.lc_recipe_drafts for all to authenticated
 using (owner_id=(select auth.uid()) and (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.lc_owner_members m where m.user_id=lc_recipe_drafts.owner_id and m.active))
 with check (owner_id=(select auth.uid()) and (select auth.jwt()->>'aal')='aal2' and exists(select 1 from public.lc_owner_members m where m.user_id=lc_recipe_drafts.owner_id and m.active));
create function public.lc_recipe_revision() returns trigger language plpgsql set search_path='' as $$
begin
 new.updated_at=now(); new.revision=old.revision+1; return new;
end; $$;
create trigger lc_recipe_revision before update on public.lc_recipe_drafts for each row execute function public.lc_recipe_revision();
revoke all on function public.lc_recipe_revision() from public, anon, authenticated;
commit;
-- Membership is provisioned by the authorized operator only after owner identity verification.
-- No anonymous access, no self-enrollment, no delete grants, no service-role key in browser.
