"use client";

import { useEffect, useMemo, useState } from "react";
import type { Person, PersonRole } from "@/types";

export function usePeople() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((data) => {
        setPeople(data.people ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = useMemo(
    () => [...people].sort((a, b) => a.name.localeCompare(b.name)),
    [people],
  );

  const byRole = useMemo(() => {
    const counts: Record<PersonRole, number> = {
      client: 0,
      reviewer: 0,
      owner: 0,
      observer: 0,
    };
    for (const p of people) counts[p.role] = (counts[p.role] ?? 0) + 1;
    return counts;
  }, [people]);

  const stats = useMemo(
    () => ({
      total: people.length,
      active: people.filter((p) => p.active).length,
      byRole,
    }),
    [people, byRole],
  );

  return { people: sorted, stats, loading };
}
