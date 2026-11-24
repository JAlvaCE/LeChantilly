-- Dedicated development database. No commerce, no real user data.
begin;
create schema lc_private;
revoke all on schema lc_private from public,anon,authenticated;
grant usage on schema lc_private to authenticated;
create table lc_private.business(
 id uuid primary key default gen_random_uuid(), name text not null check(length(btrim(name)) between 1 and 120),
 draft_revision bigint not null default 0 check(draft_revision>=0), publication bigint not null default 0 check(publication>=0),
 mode text not null default 'development' check(mode='development')
);
create table lc_private.membership(
 business_id uuid not null references lc_private.business(id), user_id uuid not null references auth.users(id) on delete restrict,
 role text not null check(role in ('owner','sales','production')), active boolean not null default false,
 primary key(business_id,user_id)
);
create index lc_membership_user on lc_private.membership(user_id);
create table lc_private.catalog_revision(
 business_id uuid not null references lc_private.business(id), revision bigint not null check(revision>0),
 document jsonb not null, created_by uuid not null, created_at timestamptz not null default now(), primary key(business_id,revision)
);
create table lc_private.category(
 business_id uuid not null, revision bigint not null, id uuid not null, name text not null check(length(btrim(name)) between 1 and 100),
 slug text not null check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), position integer not null check(position between 0 and 10000), active boolean not null,
 primary key(business_id,revision,id),unique(business_id,revision,slug),foreign key(business_id,revision) references lc_private.catalog_revision
);
create table lc_private.production_family(
 business_id uuid not null,revision bigint not null,id uuid not null,name text not null check(length(btrim(name)) between 1 and 100),
 primary key(business_id,revision,id),foreign key(business_id,revision) references lc_private.catalog_revision
);
create table lc_private.product(
 business_id uuid not null,revision bigint not null,id uuid not null,name text not null check(length(btrim(name)) between 1 and 120),
 slug text not null check(length(slug)<=120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 description text not null check(length(btrim(description)) between 1 and 1000), active boolean not null, custom boolean not null,
 family_id uuid, primary key(business_id,revision,id),unique(business_id,revision,slug),
 foreign key(business_id,revision) references lc_private.catalog_revision,
 foreign key(business_id,revision,family_id) references lc_private.production_family
);
create index lc_product_family on lc_private.product(business_id,revision,family_id);
create table lc_private.product_category(
 business_id uuid not null,revision bigint not null,product_id uuid not null,category_id uuid not null,
 primary key(business_id,revision,product_id,category_id),
 foreign key(business_id,revision,product_id) references lc_private.product,
 foreign key(business_id,revision,category_id) references lc_private.category
);
create index lc_pc_category on lc_private.product_category(business_id,revision,category_id);
create table lc_private.variant(
 business_id uuid not null,revision bigint not null,id uuid not null,product_id uuid not null,
 name text not null check(length(btrim(name)) between 1 and 120), unit text not null check(unit in ('pieza','caja','torta','porción','lote')),
 min_qty integer not null check(min_qty between 1 and 1000), multiple integer not null check(multiple between 1 and 1000), lead_hours integer not null check(lead_hours between 0 and 2160),
 price_cop bigint check(price_cop between 1 and 1000000000), active boolean not null,
 primary key(business_id,revision,id),foreign key(business_id,revision,product_id) references lc_private.product,check(min_qty%multiple=0)
);
create index lc_variant_product on lc_private.variant(business_id,revision,product_id);
create table lc_private.collection(
 business_id uuid not null,revision bigint not null,id uuid not null,name text not null check(length(btrim(name)) between 1 and 100),
 slug text not null check(length(slug)<=100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),active boolean not null,
 primary key(business_id,revision,id),unique(business_id,revision,slug),foreign key(business_id,revision) references lc_private.catalog_revision
);
create table lc_private.collection_product(
 business_id uuid not null,revision bigint not null,collection_id uuid not null,product_id uuid not null,
 primary key(business_id,revision,collection_id,product_id),foreign key(business_id,revision,collection_id) references lc_private.collection,
 foreign key(business_id,revision,product_id) references lc_private.product
);
create index lc_cp_product on lc_private.collection_product(business_id,revision,product_id);
create table lc_private.release(
 business_id uuid not null,publication bigint not null,revision bigint not null,actor uuid not null,
 created_at timestamptz not null default now(),primary key(business_id,publication),
 foreign key(business_id,revision) references lc_private.catalog_revision
);
create index lc_release_revision on lc_private.release(business_id,revision);
create table lc_private.audit_event(
 id bigint generated always as identity primary key,business_id uuid not null references lc_private.business,
 actor uuid not null,action text not null check(action in ('draft_saved','catalog_published')),revision bigint not null,
 created_at timestamptz not null default now()
);
create index lc_audit_business on lc_private.audit_event(business_id,created_at desc);
-- The only public table. Contains explicit public projection, never private draft payload.
create table public.lc_catalog_public(
 business_id uuid primary key, publication bigint not null, revision bigint not null, snapshot jsonb not null,
 published_at timestamptz not null default now()
);
alter table public.lc_catalog_public enable row level security;
alter table public.lc_catalog_public force row level security;
revoke all on public.lc_catalog_public from public,anon,authenticated;
grant select on public.lc_catalog_public to anon,authenticated;
create policy lc_preview_read on public.lc_catalog_public for select to anon,authenticated using(true);
do $ddl$ declare t record; begin
 for t in select tablename from pg_catalog.pg_tables where schemaname='lc_private' loop
 execute format('alter table lc_private.%I enable row level security',t.tablename);
 execute format('alter table lc_private.%I force row level security',t.tablename);
 execute format('revoke all on lc_private.%I from public,anon,authenticated',t.tablename);
 end loop;
end $ddl$;
create function lc_private.assert_owner(b uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null or coalesce(auth.jwt()->>'aal','')<>'aal2' or not exists(select 1 from lc_private.membership m where m.business_id=b and m.user_id=u and m.role='owner' and m.active) then raise exception 'not authorized' using errcode='42501'; end if;
 return u;
end $$;
create function lc_private.check_array(d jsonb,k text,fields text[],lim int) returns void language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(d->k) is distinct from 'array' or jsonb_array_length(d->k)>lim then raise exception 'invalid array: %',k using errcode='22023'; end if;
 if exists(select 1 from jsonb_array_elements(d->k) x where jsonb_typeof(x)<>'object') then raise exception 'invalid object: %',k using errcode='22023';end if;
 if exists(select 1 from jsonb_array_elements(d->k) x where not(x ?& fields) or exists(select 1 from jsonb_object_keys(x) key where not(key=any(fields)))) then raise exception 'invalid fields: %',k using errcode='22023';end if;
end $$;
create function lc_private.save_catalog(b uuid,expected bigint,d jsonb) returns bigint language plpgsql security definer set search_path='' as $$
declare u uuid:=lc_private.assert_owner(b); n bigint; current_rev bigint;
begin
 select draft_revision into current_rev from lc_private.business where id=b for update;
 if expected is null or expected<>current_rev then raise exception 'stale draft' using errcode='40001';end if;
 if d is null or jsonb_typeof(d)<>'object' or pg_column_size(d)>524288 or not(d ?& array['categories','families','products','productCategories','variants','collections','collectionProducts']) or exists(select 1 from jsonb_object_keys(d) k where k<>all(array['categories','families','products','productCategories','variants','collections','collectionProducts'])) then raise exception 'invalid catalog document' using errcode='22023';end if;
 perform lc_private.check_array(d,'categories',array['id','name','slug','position','active'],100);
 perform lc_private.check_array(d,'families',array['id','name'],100);
 perform lc_private.check_array(d,'products',array['id','name','slug','description','active','custom','family_id'],500);
 perform lc_private.check_array(d,'productCategories',array['product_id','category_id'],2500);
 perform lc_private.check_array(d,'variants',array['id','product_id','name','unit','min_qty','multiple','lead_hours','price_cop','active'],2000);
 perform lc_private.check_array(d,'collections',array['id','name','slug','active'],100);
 perform lc_private.check_array(d,'collectionProducts',array['collection_id','product_id'],2500);
 n:=current_rev+1;
 insert into lc_private.catalog_revision values(b,n,d,u,now());
 insert into lc_private.category select b,n,x.* from jsonb_to_recordset(d->'categories') as x(id uuid,name text,slug text,position integer,active boolean);
 insert into lc_private.production_family select b,n,x.* from jsonb_to_recordset(d->'families') as x(id uuid,name text);
 insert into lc_private.product select b,n,x.* from jsonb_to_recordset(d->'products') as x(id uuid,name text,slug text,description text,active boolean,custom boolean,family_id uuid);
 insert into lc_private.product_category select b,n,x.* from jsonb_to_recordset(d->'productCategories') as x(product_id uuid,category_id uuid);
 insert into lc_private.variant select b,n,x.* from jsonb_to_recordset(d->'variants') as x(id uuid,product_id uuid,name text,unit text,min_qty integer,multiple integer,lead_hours integer,price_cop bigint,active boolean);
 insert into lc_private.collection select b,n,x.* from jsonb_to_recordset(d->'collections') as x(id uuid,name text,slug text,active boolean);
 insert into lc_private.collection_product select b,n,x.* from jsonb_to_recordset(d->'collectionProducts') as x(collection_id uuid,product_id uuid);
 update lc_private.business set draft_revision=n where id=b;
 insert into lc_private.audit_event(business_id,actor,action,revision) values(b,u,'draft_saved',n);
 return n;
end $$;
create function lc_private.read_catalog(b uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=lc_private.assert_owner(b); r jsonb;
begin
 select jsonb_build_object('revision',x.draft_revision,'publication',x.publication,'document',c.document) into r from lc_private.business x left join lc_private.catalog_revision c on c.business_id=x.id and c.revision=x.draft_revision where x.id=b;
 return r;
end $$;
create function lc_private.publish_catalog(b uuid,r bigint,expected_publication bigint,expected_draft bigint) returns bigint language plpgsql security definer set search_path='' as $$
declare u uuid:=lc_private.assert_owner(b); p bigint; dr bigint; snap jsonb;
begin
 select publication,draft_revision into p,dr from lc_private.business where id=b for update;
 if expected_publication is null or expected_draft is null or p<>expected_publication or dr<>expected_draft then raise exception 'stale publication' using errcode='40001';end if;
 if r is null or not exists(select 1 from lc_private.catalog_revision where business_id=b and revision=r) then raise exception 'unknown revision' using errcode='22023';end if;
 if r<>dr and not exists(select 1 from lc_private.release where business_id=b and revision=r) then raise exception 'only published revision may be restored' using errcode='22023';end if;
 if exists(select 1 from lc_private.product x where x.business_id=b and x.revision=r and x.active and (not exists(select 1 from lc_private.product_category pc join lc_private.category c on (c.business_id,c.revision,c.id)=(pc.business_id,pc.revision,pc.category_id) where pc.business_id=b and pc.revision=r and pc.product_id=x.id and c.active) or not exists(select 1 from lc_private.variant v where v.business_id=b and v.revision=r and v.product_id=x.id and v.active))) then raise exception 'active product requires active category and presentation' using errcode='23514';end if;
 -- Preview projection: excludes family, draft prices, costs, ingredients and membership. No confirmed availability.
 select jsonb_build_object('schemaVersion',2,'mode','development-preview','commerceEnabled',false,'currency','COP',
 'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name,'slug',c.slug,'position',c.position) order by c.position,c.id) from lc_private.category c where c.business_id=b and c.revision=r and c.active),'[]'::jsonb),
 'products',coalesce((select jsonb_agg(jsonb_build_object('id',x.id,'slug',x.slug,'name',x.name,'description',x.description,'personalizable',x.custom,'availability','unconfirmed','activeForCheckout',false,'price',jsonb_build_object('mode','quote','amount',null,'currency','COP'),'categoryIds',coalesce((select jsonb_agg(c.id order by c.position,c.id) from lc_private.product_category pc join lc_private.category c on (c.business_id,c.revision,c.id)=(pc.business_id,pc.revision,pc.category_id) where pc.business_id=b and pc.revision=r and pc.product_id=x.id and c.active),'[]'::jsonb),'variants',coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'name',v.name,'unit',v.unit,'minimum',v.min_qty,'multiple',v.multiple,'leadHours',v.lead_hours) order by v.id) from lc_private.variant v where v.business_id=b and v.revision=r and v.product_id=x.id and v.active),'[]'::jsonb)) order by x.id) from lc_private.product x where x.business_id=b and x.revision=r and x.active),'[]'::jsonb),
 'collections',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'slug',c.slug,'name',c.name,'ids',coalesce((select jsonb_agg(cp.product_id order by cp.product_id) from lc_private.collection_product cp join lc_private.product x on (x.business_id,x.revision,x.id)=(cp.business_id,cp.revision,cp.product_id) where cp.business_id=b and cp.revision=r and cp.collection_id=c.id and x.active),'[]'::jsonb)) order by c.id) from lc_private.collection c where c.business_id=b and c.revision=r and c.active),'[]'::jsonb)) into snap;
 p:=p+1;
 insert into lc_private.release values(b,p,r,u,now());
 insert into public.lc_catalog_public values(b,p,r,snap,now()) on conflict(business_id) do update set publication=excluded.publication,revision=excluded.revision,snapshot=excluded.snapshot,published_at=excluded.published_at;
 update lc_private.business set publication=p where id=b;
 insert into lc_private.audit_event(business_id,actor,action,revision) values(b,u,'catalog_published',r);
 return p;
end $$;
-- Public invoker wrappers. Private security-definer functions explicitly authorize owner + AAL2.
create function public.lc_save_catalog(b uuid,expected bigint,d jsonb) returns bigint language sql security invoker set search_path='' as $$select lc_private.save_catalog(b,expected,d)$$;
create function public.lc_read_catalog(b uuid) returns jsonb language sql security invoker set search_path='' as $$select lc_private.read_catalog(b)$$;
create function public.lc_publish_catalog(b uuid,r bigint,expected_publication bigint,expected_draft bigint) returns bigint language sql security invoker set search_path='' as $$select lc_private.publish_catalog(b,r,expected_publication,expected_draft)$$;
revoke all on all functions in schema lc_private from public,anon,authenticated;
grant execute on function lc_private.save_catalog(uuid,bigint,jsonb),lc_private.read_catalog(uuid),lc_private.publish_catalog(uuid,bigint,bigint,bigint) to authenticated;
revoke all on function public.lc_save_catalog(uuid,bigint,jsonb),public.lc_read_catalog(uuid),public.lc_publish_catalog(uuid,bigint,bigint,bigint) from public,anon,authenticated;
grant execute on function public.lc_save_catalog(uuid,bigint,jsonb),public.lc_read_catalog(uuid),public.lc_publish_catalog(uuid,bigint,bigint,bigint) to authenticated;
insert into lc_private.business(name) values('Le Chantilly — desarrollo');
commit;