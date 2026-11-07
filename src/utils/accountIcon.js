import { Banknote, Landmark, Smartphone } from 'lucide-react'

export function accountIcon(type) {
  if (type === 'Cash') return Banknote
  if (type === 'Wallet') return Smartphone
  return Landmark
}
