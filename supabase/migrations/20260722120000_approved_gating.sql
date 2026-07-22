-- ============================================================================
--  Gate catalog & inventory writes behind supplier approval.
--  Only APPROVED suppliers may create/update products or adjust stock. Owners
--  can still read their own rows in any status; admins keep full access.
-- ============================================================================

-- products: separate owner READ (any status) from owner WRITE (approved only).
drop policy if exists "products_write_own" on public.products;

drop policy if exists "products_read_own" on public.products;
create policy "products_read_own" on public.products
  for select to authenticated using (
    exists (
      select 1 from public.suppliers s
      where s.id = supplier_id and s.owner_user_id = auth.uid()
    )
  );

create policy "products_write_own" on public.products
  for all to authenticated
  using (
    exists (
      select 1 from public.suppliers s
      where s.id = supplier_id and s.owner_user_id = auth.uid() and s.status = 'approved'
    )
  )
  with check (
    exists (
      select 1 from public.suppliers s
      where s.id = supplier_id and s.owner_user_id = auth.uid() and s.status = 'approved'
    )
  );

-- inventory adjustments: insert only when the product's supplier is approved.
drop policy if exists "adjustments_insert_own" on public.inventory_adjustments;
create policy "adjustments_insert_own" on public.inventory_adjustments
  for insert to authenticated with check (
    exists (
      select 1 from public.products p
      join public.suppliers s on s.id = p.supplier_id
      where p.id = product_id and s.owner_user_id = auth.uid() and s.status = 'approved'
    )
  );
