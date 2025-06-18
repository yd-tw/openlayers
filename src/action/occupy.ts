import { doc, setDoc, Timestamp } from 'firebase/firestore'
import db from '@/lib/firebase'

export async function occupyGrid({
  id,
  label,
  owner = 'anonymous',
}: {
  id: string
  label: string
  owner?: string
}) {
  const ref = doc(db, 'grids', id)

  await setDoc(ref, {
    id,
    label,
    owner,
    timestamp: Timestamp.now()
  })

  console.log(`Grid ${id} has been occupied by ${owner}.`)
}
