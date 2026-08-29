-- Phase 5 (Docs/AI-Native-Migration-Plan.md): an approval has to be
-- creatable from inside a write tool's handler, mid-agent-run — before the
-- triggering `ai_agent_runs` row exists under the original one-insert-at-
-- the-end pattern from Phase 4. Scoping by tenant_id/thread_id (both known
-- at tool-construction time, well before the run finishes) avoids that
-- ordering dependency entirely. agent_run_id becomes an optional
-- backreference instead of the required scope.
alter table ai_approvals
  add column tenant_id uuid,
  add column thread_id uuid,
  alter column agent_run_id drop not null;

create index ai_approvals_thread_idx on ai_approvals (thread_id);
create index ai_approvals_tenant_idx on ai_approvals (tenant_id, status);
