begin;
-- Strict JSON types before jsonb_to_recordset coercion.
create or replace function lc_private.check_array(d jsonb,k text,fields text[],lim int) returns void language plpgsql set search_path='' as $$
declare rowdata jsonb; field text; kind text; val jsonb;
begin
 if jsonb_typeof(d->k) is distinct from 'array' then raise exception 'invalid array: %',k using errcode='22023';end if;
 if jsonb_array_length(d->k)>lim then raise exception 'array too large: %',k using errcode='22023';end if;
 for rowdata in select value from jsonb_array_elements(d->k) loop
  if jsonb_typeof(rowdata)<>'object' then raise exception 'invalid object: %',k using errcode='22023';end if;
  if not(rowdata ?& fields) or exists(select 1 from jsonb_object_keys(rowdata) f where not(f=any(fields))) then raise exception 'invalid fields: %',k using errcode='22023';end if;
  foreach field in array fields loop
   val:=rowdata->field;kind:=jsonb_typeof(val);
   if field in ('family_id','price_cop') and kind='null' then continue;end if;
   if field in ('active','custom') then
    if kind<>'boolean' then raise exception 'invalid boolean: %',field using errcode='22023';end if;
   elsif field in ('position','min_qty','multiple','lead_hours','price_cop') then
    if kind<>'number' or val::text !~ '^[0-9]+$' then raise exception 'invalid integer: %',field using errcode='22023';end if;
   elsif kind<>'string' then raise exception 'invalid string: %',field using errcode='22023';
   end if;
  end loop;
 end loop;
end $$;
-- Recipe identity is the business, not a personal account. Draft revisions are immutable.
create table lc_private.recipe(
 business_id uuid not null references lc_private.business,id uuid not null,current_revision bigint not null check(current_revision>0),
 created_at timestamptz not null default now(), primary key(business_id,id)
);
create table lc_private.recipe_revision(
 business_id uuid not null,recipe_id uuid not null,revision bigint not null check(revision>0),
 title text not null check(length(btrim(title)) between 1 and 120), unit text not null check(unit in ('pieza','torta','caja','porción','lote')),
 gross_yield integer not null check(gross_yield between 1 and 10000), waste_units integer not null check(waste_units>=0 and waste_units<gross_yield),
 ingredient_cost_cop bigint not null check(ingredient_cost_cop between 0 and 100000000),active_minutes integer not null check(active_minutes between 0 and 1440),
 status text not null check(status in ('draft','archived')),actor uuid not null,created_at timestamptz not null default now(),
 primary key(business_id,recipe_id,revision),foreign key(business_id,recipe_id) references lc_private.recipe(business_id,id)
);
alter table lc_private.recipe enable row level security;alter table lc_private.recipe force row level security;
alter table lc_private.recipe_revision enable row level security;alter table lc_private.recipe_revision force row level security;
revoke all on lc_private.recipe,lc_private.recipe_revision from public,anon,authenticated;
grant select,insert on lc_private.recipe,lc_private.recipe_revision to lc_catalog_executor;
grant update(current_revision) on lc_private.recipe to lc_catalog_executor;
create policy lc_recipe_executor_read on lc_private.recipe for select to lc_catalog_executor using(true);
create policy lc_recipe_executor_insert on lc_private.recipe for insert to lc_catalog_executor with check(true);
create policy lc_recipe_executor_update on lc_private.recipe for update to lc_catalog_executor using(true) with check(true);
create policy lc_recipe_revision_executor_read on lc_private.recipe_revision for select to lc_catalog_executor using(true);
create policy lc_recipe_revision_executor_insert on lc_private.recipe_revision for insert to lc_catalog_executor with check(true);
create function lc_private.save_recipe(b uuid,r uuid,expected bigint,d jsonb) returns bigint language plpgsql security definer set search_path='' as $$
declare u uuid:=lc_private.assert_owner(b); n bigint; fields text[]:=array['title','unit','gross_yield','waste_units','ingredient_cost_cop','active_minutes','status']; f text;
begin
 if r is null or expected is null or expected<0 or d is null or jsonb_typeof(d)<>'object' or not(d ?& fields) or exists(select 1 from jsonb_object_keys(d) k where k<>all(fields)) or pg_column_size(d)>8192 then raise exception 'invalid recipe draft' using errcode='22023';end if;
 foreach f in array fields loop
  if f in ('gross_yield','waste_units','ingredient_cost_cop','active_minutes') then
   if jsonb_typeof(d->f)<>'number' or (d->f)::text !~ '^[0-9]+$' then raise exception 'invalid integer' using errcode='22023';end if;
  elsif jsonb_typeof(d->f)<>'string' then raise exception 'invalid string' using errcode='22023';end if;
 end loop;
 perform 1 from lc_private.business where id=b for update;
 select current_revision into n from lc_private.recipe where business_id=b and id=r;
 if coalesce(n,0)<>expected then raise exception 'stale recipe' using errcode='40001';end if;
 n:=expected+1;
 if expected=0 then insert into lc_private.recipe(business_id,id,current_revision) values(b,r,n);else update lc_private.recipe set current_revision=n where business_id=b and id=r;end if;
 insert into lc_private.recipe_revision(business_id,recipe_id,revision,title,unit,gross_yield,waste_units,ingredient_cost_cop,active_minutes,status,actor)
 select b,r,n,x.title,x.unit,x.gross_yield,x.waste_units,x.ingredient_cost_cop,x.active_minutes,x.status,u from jsonb_to_record(d) as x(title text,unit text,gross_yield integer,waste_units integer,ingredient_cost_cop bigint,active_minutes integer,status text);
 return n;
end $$;
create function lc_private.read_recipe(b uuid,r uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=lc_private.assert_owner(b); d jsonb;
begin
 select to_jsonb(v)-'business_id'-'actor' into d from lc_private.recipe x join lc_private.recipe_revision v on (v.business_id,v.recipe_id,v.revision)=(x.business_id,x.id,x.current_revision) where x.business_id=b and x.id=r;
 return d;
end $$;
grant create on schema lc_private to lc_catalog_executor;
alter function lc_private.save_recipe(uuid,uuid,bigint,jsonb) owner to lc_catalog_executor;
alter function lc_private.read_recipe(uuid,uuid) owner to lc_catalog_executor;
revoke create on schema lc_private from lc_catalog_executor;
revoke all on function lc_private.save_recipe(uuid,uuid,bigint,jsonb),lc_private.read_recipe(uuid,uuid) from public,anon,authenticated;
grant execute on function lc_private.save_recipe(uuid,uuid,bigint,jsonb),lc_private.read_recipe(uuid,uuid) to authenticated;
create function public.lc_save_recipe(b uuid,r uuid,expected bigint,d jsonb) returns bigint language sql security invoker set search_path='' as $$select lc_private.save_recipe(b,r,expected,d)$$;
create function public.lc_read_recipe(b uuid,r uuid) returns jsonb language sql security invoker set search_path='' as $$select lc_private.read_recipe(b,r)$$;
revoke all on function public.lc_save_recipe(uuid,uuid,bigint,jsonb),public.lc_read_recipe(uuid,uuid) from public,anon,authenticated;
grant execute on function public.lc_save_recipe(uuid,uuid,bigint,jsonb),public.lc_read_recipe(uuid,uuid) to authenticated;
commit;