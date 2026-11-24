begin;
-- A hidden or empty draft may be saved, never accidentally published.
alter table public.lc_catalog_public add constraint lc_release_nonempty check (coalesce(jsonb_typeof(snapshot->'products')='array' and jsonb_array_length(snapshot->'products')>0,false));
commit;