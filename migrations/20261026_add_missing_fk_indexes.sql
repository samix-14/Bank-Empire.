-- Bank Empire: indexes for foreign-key columns reported by Supabase Performance Advisor.
-- Safe to run repeatedly; existing indexes are preserved.
create index if not exists account_access_tokens_account_id_idx on public.account_access_tokens (account_id);
create index if not exists account_access_tokens_user_id_idx on public.account_access_tokens (user_id);
create index if not exists account_balances_currency_idx on public.account_balances (currency);
create index if not exists account_exchange_transactions_account_id_idx on public.account_exchange_transactions (account_id);
create index if not exists account_exchange_transactions_from_currency_idx on public.account_exchange_transactions (from_currency);
create index if not exists account_exchange_transactions_to_currency_idx on public.account_exchange_transactions (to_currency);
create index if not exists account_transactions_currency_idx on public.account_transactions (currency);
create index if not exists admin_audit_log_actor_id_idx on public.admin_audit_log (actor_id);
create index if not exists admin_audit_log_target_user_id_idx on public.admin_audit_log (target_user_id);
create index if not exists empire_treasury_currency_idx on public.empire_treasury (currency);
create index if not exists empires_selected_insurance_plan_id_idx on public.empires (selected_insurance_plan_id);
create index if not exists exchange_rates_to_currency_idx on public.exchange_rates (to_currency);
create index if not exists insurance_plans_currency_idx on public.insurance_plans (currency);
create index if not exists user_messages_empire_id_idx on public.user_messages (empire_id);
create index if not exists user_messages_recipient_id_idx on public.user_messages (recipient_id);
create index if not exists user_messages_sender_id_idx on public.user_messages (sender_id);
