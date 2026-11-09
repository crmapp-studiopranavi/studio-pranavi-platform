import { useEffect, useRef } from 'react';
import { supabase } from '../supabase';

const POLL_INTERVAL_MS = 30_000;

export function useOutboxWorker() {
  const isRunning = useRef(false);

  useEffect(() => {
    async function tick() {
      if (isRunning.current) return;
      isRunning.current = true;
      try {
        await supabase.rpc('enqueue_time_based_notifications');

        for (let i = 0; i < 10; i++) {
          const { data, error } = await supabase.rpc('process_next_outbox_item');
          if (error || !data) break;
          if ((data as { done: boolean }).done) break;
        }
      } finally {
        isRunning.current = false;
      }
    }

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);
}
