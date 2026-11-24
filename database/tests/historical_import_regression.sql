-- Isolated development only; all fixtures roll back.
begin;
insert into auth.users(id,email) values('aaaa0000-0000-4000-8000-000000000051','lc-preservation-test@example.invalid');
insert into lc_private.membership(business_id,user_id,role,active) select id,'aaaa0000-0000-4000-8000-000000000051','owner',true from lc_private.business where name='Le Chantilly — desarrollo';
select set_config('lc.test_business',(select id::text from lc_private.business where name='Le Chantilly — desarrollo'),true);
select set_config('lc.test_document',(select draft_document::text from lc_private.historical_catalog_import where business_id=current_setting('lc.test_business')::uuid),true);
select set_config('request.jwt.claims','{"sub":"aaaa0000-0000-4000-8000-000000000051","role":"authenticated","aal":"aal2"}',true);
set local role authenticated;
do $$ declare b uuid:=current_setting('lc.test_business')::uuid; d jsonb:=current_setting('lc.test_document')::jsonb; r jsonb; begin
 if public.lc_save_catalog(b,0,d)<>1 then raise exception 'FAIL save';end if;
 r:=public.lc_read_catalog(b);
 if r->'document'<>d then raise exception 'FAIL draft equality';end if;
 if jsonb_array_length(r#>'{document,products}')<>17 then raise exception 'FAIL products';end if;
 if jsonb_array_length(r#>'{document,productCategories}')<>17 then raise exception 'FAIL category relationships';end if;
 if exists(select 1 from public.lc_catalog_public where business_id=b) then raise exception 'FAIL accidental publication';end if;
end $$;
reset role;
select count(*) as normalized_products,count(*) filter(where not active) as hidden_products from lc_private.product where business_id=current_setting('lc.test_business')::uuid and revision=1;
select count(*) as normalized_relationships from lc_private.collection_product where business_id=current_setting('lc.test_business')::uuid and revision=1;
rollback;