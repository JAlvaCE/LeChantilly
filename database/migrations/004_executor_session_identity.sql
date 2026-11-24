begin;
-- Supabase's managed auth schema does not allow the project postgres role to grant USAGE
-- to an arbitrary role. The narrow helper reads only the verified request identity.
create function lc_private.session_identity() returns table(uid uuid,aal text)
 language sql stable security definer set search_path='' as $$select auth.uid(),auth.jwt()->>'aal'$$;
revoke all on function lc_private.session_identity() from public,anon,authenticated;
grant execute on function lc_private.session_identity() to lc_catalog_executor;
create or replace function lc_private.assert_owner(b uuid) returns uuid language plpgsql security invoker set search_path='' as $$
declare u uuid; assurance text;
begin
 select uid,aal into u,assurance from lc_private.session_identity();
 if u is null or coalesce(assurance,'')<>'aal2' then raise exception 'not authorized' using errcode='42501';end if;
 perform 1 from lc_private.membership m where m.business_id=b and m.user_id=u and m.role='owner' and m.active for share;
 if not found then raise exception 'not authorized' using errcode='42501';end if;
 return u;
end $$;
create policy lc_executor_membership_lock on lc_private.membership for update to lc_catalog_executor using(true) with check(false);
commit;