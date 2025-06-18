import { doc, setDoc, Timestamp } from "firebase/firestore";
import { collection, getDocs } from "firebase/firestore";
import db from "@/lib/firebase";

export async function occupyGrid({
  id,
  label,
  owner = "anonymous",
}: {
  id: string;
  label: string;
  owner?: string;
}) {
  const ref = doc(db, "grids", id);

  await setDoc(ref, {
    id,
    label,
    owner,
    timestamp: Timestamp.now(),
  });

  console.log(`Grid ${id} has been occupied by ${owner}.`);
}

export async function getOccupiedGrids(): Promise<
  Record<string, { owner: string; label: string }>
> {
  const snapshot = await getDocs(collection(db, "grids"));
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
