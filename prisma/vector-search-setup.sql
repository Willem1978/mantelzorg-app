-- ============================================================
-- Vector Search Infrastructure voor MantelBuddy
-- ============================================================
-- Vereist: Supabase PostgreSQL met pgvector
--
-- Dit script:
-- 1. Activeert de pgvector extensie
-- 2. Voegt embedding kolommen toe aan Artikel en Zorgorganisatie
-- 3. Maakt HNSW indexes voor snelle similarity search
-- 4. Maakt search functies die vanuit de app aangeroepen worden
--
-- Uitvoeren: Supabase Dashboard → SQL Editor → plak dit script
-- ============================================================

-- Stap 1: Activeer pgvector extensie
create extension if not exists vector with schema extensions;

-- Stap 2: Embedding kolommen toevoegen
-- Gebruikt OpenAI text-embedding-3-small (1536 dimensies)
alter table "Artikel"
  add column if not exists embedding extensions.vector(1536);

alter table "Zorgorganisatie"
  add column if not exists embedding extensions.vector(1536);

-- Stap 3: HNSW indexes voor cosine similarity
-- HNSW is sneller dan IVFFlat en heeft geen training nodig
create index if not exists artikel_embedding_idx
  on "Artikel"
  using hnsw (embedding extensions.vector_cosine_ops);

create index if not exists zorgorganisatie_embedding_idx
  on "Zorgorganisatie"
  using hnsw (embedding extensions.vector_cosine_ops);

-- Stap 4: Similarity search functie voor Artikelen
create or replace function match_artikelen(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
)
returns table (
  id text,
  titel text,
  beschrijving text,
  categorie text,
  url text,
  bron text,
  "bronLabel" text,
  emoji text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    a.id,
    a.titel,
    a.beschrijving,
    a.categorie,
    a.url,
    a.bron,
    a."bronLabel",
    a.emoji,
    1 - (a.embedding <=> query_embedding) as similarity
  from "Artikel" a
  where a."isActief" = true
    and a.embedding is not null
    and 1 - (a.embedding <=> query_embedding) > match_threshold
  order by a.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Stap 5: Similarity search functie voor Zorgorganisaties
create or replace function match_zorgorganisaties(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  filter_gemeente text default null
)
returns table (
  id text,
  naam text,
  beschrijving text,
  dienst text,
  telefoon text,
  website text,
  email text,
  gemeente text,
  kosten text,
  openingstijden text,
  "soortHulp" text,
  "onderdeelTest" text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    z.id,
    z.naam,
    z.beschrijving,
    z.dienst,
    z.telefoon,
    z.website,
    z.email,
    z.gemeente,
    z.kosten,
    z.openingstijden,
    z."soortHulp",
    z."onderdeelTest",
    1 - (z.embedding <=> query_embedding) as similarity
  from "Zorgorganisatie" z
  where z."isActief" = true
    and z.embedding is not null
    and 1 - (z.embedding <=> query_embedding) > match_threshold
    and (filter_gemeente is null or z.gemeente = filter_gemeente)
  order by z.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Stap 6: Gecombineerde search over beide tabellen
create or replace function semantic_search(
  query_embedding extensions.vector(1536),
  match_threshold float default 0.5,
  match_count int default 10,
  filter_gemeente text default null,
  search_type text default 'all' -- 'all', 'artikelen', 'hulpbronnen'
)
returns table (
  id text,
  bron_type text,
  titel text,
  beschrijving text,
  extra_info jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  (
    -- Artikelen
    select
      a.id,
      'artikel'::text as bron_type,
      a.titel,
      a.beschrijving,
      jsonb_build_object(
        'categorie', a.categorie,
        'url', a.url,
        'bron', a.bron,
        'bronLabel', a."bronLabel",
        'emoji', a.emoji
      ) as extra_info,
      1 - (a.embedding <=> query_embedding) as similarity
    from "Artikel" a
    where a."isActief" = true
      and a.embedding is not null
      and 1 - (a.embedding <=> query_embedding) > match_threshold
      and search_type in ('all', 'artikelen')
  )
  union all
  (
    -- Zorgorganisaties
    select
      z.id,
      'hulpbron'::text as bron_type,
      z.naam as titel,
      z.beschrijving,
      jsonb_build_object(
        'dienst', z.dienst,
        'telefoon', z.telefoon,
        'website', z.website,
        'email', z.email,
        'gemeente', z.gemeente,
        'kosten', z.kosten,
        'openingstijden', z.openingstijden,
        'soortHulp', z."soortHulp",
        'onderdeelTest', z."onderdeelTest"
      ) as extra_info,
      1 - (z.embedding <=> query_embedding) as similarity
    from "Zorgorganisatie" z
    where z."isActief" = true
      and z.embedding is not null
      and 1 - (z.embedding <=> query_embedding) > match_threshold
      and (filter_gemeente is null or z.gemeente = filter_gemeente)
      and search_type in ('all', 'hulpbronnen')
  )
  order by similarity desc
  limit match_count;
end;
$$;
