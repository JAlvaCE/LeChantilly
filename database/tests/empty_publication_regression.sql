begin;
insert into auth.users(id,email) values('aaaa0000-0000-4000-8000-000000000061','lc-empty-test@example.invalid');
insert into lc_private.membership(business_id,user_id,role,active) select id,'aaaa0000-0000-4000-8000-000000000061','owner',true from lc_private.business;
select set_config('lc.test_business',(select id::text from lc_private.business limit 1),true);
select set_config('request.jwt.claims','{"sub":"aaaa0000-0000-4000-8000-000000000061","role":"authenticated","aal":"aal2"}',true);
set local role authenticated;
do $$ declare b uuid:=current_setting('lc.test_business')::uuid; begin
 if public.lc_save_catalog(b,0,'{"categories":[],"families":[],"products":[],"productCategories":[],"variants":[],"collections":[],"collectionProducts":[]}')<>1 then raise exception 'FAIL save empty draft'; end if;
 begin perform public.lc_publish_catalog(b,1,0,1); raise exception 'FAIL empty publish'; exception when check_violation then null; end;
 if (public.lc_read_catalog(b)->>'publication')::int<>0 or exists(select 1 from public.lc_catalog_public where business_id=b) then raise exception 'FAIL atomic publication';end if;
end $$;
reset role;
select 3 as passed;
rollback;