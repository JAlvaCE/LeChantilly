begin;
-- AAL1 is allowed to learn ONLY whether the verified session is an active owner.
create function lc_private.owner_context(b uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid; assurance text;
begin
 select uid,aal into u,assurance from lc_private.session_identity();
 if u is null or assurance is null or assurance not in ('aal1','aal2') or not exists(select 1 from lc_private.membership m where m.business_id=b and m.user_id=u and m.role='owner' and m.active) then raise exception 'not authorized' using errcode='42501';end if;
 return jsonb_build_object('owner',true,'aal',assurance);
end $$;
create function lc_private.catalog_history(b uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=lc_private.assert_owner(b); result jsonb;
begin
 select coalesce(jsonb_agg(to_jsonb(x) order by x.publication desc),'[]'::jsonb) into result from (select publication,revision,created_at from lc_private.release where business_id=b order by publication desc limit 50) x;
 return result;
end $$;
grant create on schema lc_private to lc_catalog_executor;
alter function lc_private.owner_context(uuid) owner to lc_catalog_executor;
alter function lc_private.catalog_history(uuid) owner to lc_catalog_executor;
revoke create on schema lc_private from lc_catalog_executor;
revoke all on function lc_private.owner_context(uuid),lc_private.catalog_history(uuid) from public,anon,authenticated;
grant execute on function lc_private.owner_context(uuid),lc_private.catalog_history(uuid) to authenticated;
create function public.lc_owner_context(b uuid) returns jsonb language sql security invoker set search_path='' as $$select lc_private.owner_context(b)$$;
create function public.lc_catalog_history(b uuid) returns jsonb language sql security invoker set search_path='' as $$select lc_private.catalog_history(b)$$;
revoke all on function public.lc_owner_context(uuid),public.lc_catalog_history(uuid) from public,anon,authenticated;
grant execute on function public.lc_owner_context(uuid),public.lc_catalog_history(uuid) to authenticated;
commit;