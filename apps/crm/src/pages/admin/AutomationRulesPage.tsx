/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AutomationRule {
  id: string;
  rule_key: string;
  label: string;
  description: string | null;
  enabled: boolean;
  config: Record<string, unknown>;
}

export function AutomationRulesPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState('');
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('automation_rules')
      .select('*')
      .order('created_at')
      .then(({ data }) => {
        if (data) setRules(data as AutomationRule[]);
        setIsLoading(false);
      });
  }, []);

  async function toggleRule(id: string, enabled: boolean) {
    setSaving(id);
    await supabase.from('automation_rules').update({ enabled }).eq('id', id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
    setSaving(null);
  }

  function startEditConfig(rule: AutomationRule) {
    setEditingConfig(rule.id);
    setConfigDraft(JSON.stringify(rule.config, null, 2));
    setConfigError(null);
  }

  async function saveConfig(id: string) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(configDraft);
    } catch {
      setConfigError('Invalid JSON');
      return;
    }
    setSaving(id);
     
    await supabase
      .from('automation_rules')
      .update({ config: parsed as any })
      .eq('id', id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, config: parsed } : r)));
    setEditingConfig(null);
    setSaving(null);
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Automation Rules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable automations and configure their parameters.
        </p>
      </div>

      <ul className="space-y-4">
        {rules.map((rule) => (
          <li key={rule.id} className="rounded-lg border bg-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{rule.label}</p>
                {rule.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                )}
              </div>
              <button
                type="button"
                disabled={saving === rule.id}
                onClick={() => toggleRule(rule.id, !rule.enabled)}
                aria-checked={rule.enabled}
                role="switch"
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 ${rule.enabled ? 'bg-primary' : 'bg-input'}`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${rule.enabled ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {editingConfig === rule.id ? (
              <div className="space-y-2">
                <textarea
                  value={configDraft}
                  onChange={(e) => {
                    setConfigDraft(e.target.value);
                    setConfigError(null);
                  }}
                  rows={6}
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {configError && <p className="text-xs text-destructive">{configError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={() => saveConfig(rule.id)}
                    disabled={saving === rule.id}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingConfig(null)}
                    className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                  {JSON.stringify(rule.config)}
                </code>
                <button
                  onClick={() => startEditConfig(rule)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit config
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
