-- Executar no Supabase → SQL Editor (uma vez por projeto).
-- Bucket público para URLs dos anexos dos cards (upload só pela API com service role).

insert into storage.buckets (id, name, public, file_size_limit)
values ('card-attachments', 'card-attachments', true, 12582912)
on conflict (id) do update set public = excluded.public;

-- Leitura pública dos ficheiros (URLs em getPublicUrl).
create policy "card_attachments_public_read"
  on storage.objects for select
  using (bucket_id = 'card-attachments');

-- Opcional: se quiseres upload também com utilizadores autenticados via cliente,
-- adiciona políticas de insert; hoje o servidor usa service role (ignora RLS).
