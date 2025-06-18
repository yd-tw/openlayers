"use server"

import { db } from "@/lib/firebase-admin";

export async function occupyGrid({
  id,
  label,
  owner = "anonymous",
}: {
  id: string;
  label: string;
  owner?: string;
}) {
  const ref = db.collection("grids").doc(id);

  await ref.set({
    id,
    label,
    owner,
    timestamp: new Date(),
  });

  console.log(`Grid ${id} has been occupied by ${owner}.`);
}

export async function getOccupiedGrids(): Promise<
  Record<string, { owner: string; label: string }>
> {
  const snapshot = await db.collection("grids").get();
  const result: Record<string, { owner: string; label: string }> = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    result[data.id] = {
      owner: data.owner,
      label: data.label,
    };
  });

  return result;
}
