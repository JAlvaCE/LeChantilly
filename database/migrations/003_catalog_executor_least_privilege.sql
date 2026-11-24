begin;
create role lc_catalog_executor nologin noinherit nocreatedb nocreaterole nobypassrls;
grant lc_catalog_executor to postgres;
grant usage,create on schema lc_private to lc_catalog_executor;
grant usage on schema public,auth to lc_catalog_executor;
grant execute on function auth.uid(),auth.jwt() to lc_catalog_executor;
grant select on all tables in schema lc_private to lc_catalog_executor;
grant update(draft_revision,publication) on lc_private.business to lc_catalog_executor;
grant insert on lc_private.catalog_revision,lc_private.category,lc_private.production_family,lc_private.product,lc_private.product_category,lc_private.variant,lc_private.collection,lc_private.collection_product,lc_private.release,lc_private.audit_event to lc_catalog_executor;
grant usage on sequence lc_private.audit_event_id_seq to lc_catalog_executor;
grant select,insert,update on public.lc_catalog_public to lc_catalog_executor;
do $ddl$ declare t record; begin
 for t in select tablename from pg_catalog.pg_tables where schemaname='lc_private' loop
 execute format('create policy lc_executor_read on lc_private.%I for select to lc_catalog_executor using(true)',t.tablename);
 if t.tablename not in ('business','membership') then execute format('create policy lc_executor_insert on lc_private.%I for insert to lc_catalog_executor with check(true)',t.tablename);end if;
 end loop;
end $ddl$;
create policy lc_executor_business_update on lc_private.business for update to lc_catalog_executor using(true) with check(true);
create policy lc_executor_public_read on public.lc_catalog_public for select to lc_catalog_executor using(true);
create policy lc_executor_public_insert on public.lc_catalog_public for insert to lc_catalog_executor with check(true);
create policy lc_executor_public_update on public.lc_catalog_public for update to lc_catalog_executor using(true) with check(true);
-- Lock active membership for the duration of the request. Revocation and edits serialize.
-- Locking SELECT requires UPDATE privilege; grant only active column with no UPDATE RLS policy.
grant update(active) on lc_private.membership to lc_catalog_executor;
create or replace function lc_private.assert_owner(b uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare u uuid:=auth.uid();
begin
 if u is null or coalesce(auth.jwt()->>'aal','')<>'aal2' then raise exception 'not authorized' using errcode='42501';end if;
 perform 1 from lc_private.membership m where m.business_id=b and m.user_id=u and m.role='owner' and m.active for share;
 if not found then raise exception 'not authorized' using errcode='42501';end if;
 return u;
end $$;
grant execute on function lc_private.assert_owner(uuid),lc_private.check_array(jsonb,text,text[],int) to lc_catalog_executor;
alter function lc_private.save_catalog(uuid,bigint,jsonb) owner to lc_catalog_executor;
alter function lc_private.read_catalog(uuid) owner to lc_catalog_executor;
alter function lc_private.publish_catalog(uuid,bigint,bigint,bigint) owner to lc_catalog_executor;
revoke create on schema lc_private from lc_catalog_executor;
commit;