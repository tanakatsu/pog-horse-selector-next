drop extension if exists "pg_net";


  create table "public"."horses" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "year" integer not null,
    "horse_id" text,
    "name" text not null,
    "sire" text not null,
    "mare" text not null,
    "owner_id" bigint not null,
    "po_order_no" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."horses" enable row level security;


  create table "public"."owners" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "year" integer not null,
    "name" text not null,
    "no" integer,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."owners" enable row level security;

CREATE UNIQUE INDEX horses_pkey ON public.horses USING btree (id);

CREATE UNIQUE INDEX horses_user_year_mare_uniq ON public.horses USING btree (user_id, year, mare);

CREATE UNIQUE INDEX horses_user_year_name_uniq ON public.horses USING btree (user_id, year, name);

CREATE INDEX idx_horses_owner_id ON public.horses USING btree (owner_id);

CREATE INDEX idx_horses_user_year ON public.horses USING btree (user_id, year);

CREATE INDEX idx_owners_user_year ON public.owners USING btree (user_id, year);

CREATE UNIQUE INDEX owners_pkey ON public.owners USING btree (id);

CREATE UNIQUE INDEX owners_user_id_uniq ON public.owners USING btree (user_id, id);

CREATE UNIQUE INDEX owners_user_year_name_uniq ON public.owners USING btree (user_id, year, name);

alter table "public"."horses" add constraint "horses_pkey" PRIMARY KEY using index "horses_pkey";

alter table "public"."owners" add constraint "owners_pkey" PRIMARY KEY using index "owners_pkey";

alter table "public"."horses" add constraint "horses_horse_id_check" CHECK (((horse_id IS NULL) OR (horse_id ~ '^\d{10}$'::text))) not valid;

alter table "public"."horses" validate constraint "horses_horse_id_check";

alter table "public"."horses" add constraint "horses_owner_fk" FOREIGN KEY (user_id, owner_id) REFERENCES public.owners(user_id, id) ON DELETE CASCADE not valid;

alter table "public"."horses" validate constraint "horses_owner_fk";

alter table "public"."horses" add constraint "horses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."horses" validate constraint "horses_user_id_fkey";

alter table "public"."horses" add constraint "horses_user_year_mare_uniq" UNIQUE using index "horses_user_year_mare_uniq";

alter table "public"."horses" add constraint "horses_user_year_name_uniq" UNIQUE using index "horses_user_year_name_uniq";

alter table "public"."owners" add constraint "owners_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."owners" validate constraint "owners_user_id_fkey";

alter table "public"."owners" add constraint "owners_user_id_uniq" UNIQUE using index "owners_user_id_uniq";

alter table "public"."owners" add constraint "owners_user_year_name_uniq" UNIQUE using index "owners_user_year_name_uniq";

grant delete on table "public"."horses" to "anon";

grant insert on table "public"."horses" to "anon";

grant references on table "public"."horses" to "anon";

grant select on table "public"."horses" to "anon";

grant trigger on table "public"."horses" to "anon";

grant truncate on table "public"."horses" to "anon";

grant update on table "public"."horses" to "anon";

grant delete on table "public"."horses" to "authenticated";

grant insert on table "public"."horses" to "authenticated";

grant references on table "public"."horses" to "authenticated";

grant select on table "public"."horses" to "authenticated";

grant trigger on table "public"."horses" to "authenticated";

grant truncate on table "public"."horses" to "authenticated";

grant update on table "public"."horses" to "authenticated";

grant delete on table "public"."horses" to "service_role";

grant insert on table "public"."horses" to "service_role";

grant references on table "public"."horses" to "service_role";

grant select on table "public"."horses" to "service_role";

grant trigger on table "public"."horses" to "service_role";

grant truncate on table "public"."horses" to "service_role";

grant update on table "public"."horses" to "service_role";

grant delete on table "public"."owners" to "anon";

grant insert on table "public"."owners" to "anon";

grant references on table "public"."owners" to "anon";

grant select on table "public"."owners" to "anon";

grant trigger on table "public"."owners" to "anon";

grant truncate on table "public"."owners" to "anon";

grant update on table "public"."owners" to "anon";

grant delete on table "public"."owners" to "authenticated";

grant insert on table "public"."owners" to "authenticated";

grant references on table "public"."owners" to "authenticated";

grant select on table "public"."owners" to "authenticated";

grant trigger on table "public"."owners" to "authenticated";

grant truncate on table "public"."owners" to "authenticated";

grant update on table "public"."owners" to "authenticated";

grant delete on table "public"."owners" to "service_role";

grant insert on table "public"."owners" to "service_role";

grant references on table "public"."owners" to "service_role";

grant select on table "public"."owners" to "service_role";

grant trigger on table "public"."owners" to "service_role";

grant truncate on table "public"."owners" to "service_role";

grant update on table "public"."owners" to "service_role";


  create policy "horses_delete"
  on "public"."horses"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "horses_insert"
  on "public"."horses"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "horses_select"
  on "public"."horses"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "horses_update"
  on "public"."horses"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "owners_delete"
  on "public"."owners"
  as permissive
  for delete
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "owners_insert"
  on "public"."owners"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "owners_select"
  on "public"."owners"
  as permissive
  for select
  to public
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "owners_update"
  on "public"."owners"
  as permissive
  for update
  to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



