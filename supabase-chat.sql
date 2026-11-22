-- شغّله بنفسك من SQL Editor بعد المراجعة. لا يحذف شيئًا.
insert into public.communities (name, description, is_general)
select 'المجتمع العام','نقاش عام بين المبدعين والمعلنين',true
where not exists (select 1 from public.communities where is_general);

insert into public.communities (campaign_id, name, description, is_general)
select c.id, 'مجتمع: '||c.title, 'نقاش خاص بالحملة', false from public.campaigns c
where c.status in ('active','paused','completed') and not exists (select 1 from public.communities m where m.campaign_id = c.id);

create or replace function public.create_campaign_community() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'active' and not exists (select 1 from public.communities where campaign_id = new.id) then
    insert into public.communities (campaign_id, name, description, is_general)
    values (new.id, 'مجتمع: '||new.title, 'نقاش خاص بالحملة', false);
  end if;
  return new;
end $$;
drop trigger if exists trg_campaign_community on public.campaigns;
create trigger trg_campaign_community after insert or update of status on public.campaigns
for each row execute function public.create_campaign_community();

create or replace function public.get_community_messages(p_community uuid, p_limit int default 100)
returns table (id uuid, user_id uuid, message text, created_at timestamptz, sender_name text, sender_role text)
language plpgsql security definer set search_path = '' as $$
begin
  if not (exists (select 1 from public.community_members m where m.community_id = p_community and m.user_id = auth.uid())
       or exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')) then
    raise exception 'غير مصرح';
  end if;
  return query select cm.id, cm.user_id, cm.message, cm.created_at, coalesce(p.full_name, 'عضو'), p.role
    from public.community_messages cm left join public.profiles p on p.id = cm.user_id
    where cm.community_id = p_community order by cm.created_at desc limit least(p_limit, 200);
end $$;
revoke all on function public.get_community_messages(uuid, int) from public, anon;
grant execute on function public.get_community_messages(uuid, int) to authenticated;

-- تحديث لحظي للرسائل (لو ظهر خطأ أنه مضاف مسبقًا، تجاهله)
alter publication supabase_realtime add table public.community_messages;
