import type { TimingPreference, TransportMode, TravelPreference } from '../lib/types'
import { useCloudState } from './useCloudState'

export interface SavedPreferences {
  cinemaSlugs: string[]
  timing: TimingPreference
  travel: TravelPreference
  transportMode: TransportMode | null
}

const KEY = 'cine-planner:saved-preferences'

const DEFAULTS: SavedPreferences = {
  cinemaSlugs: [],
  timing: 'standard',
  travel: 'minimal',
  transportMode: null,
}

/** Signed out: preferences reset to defaults every session (one-shot planning). */
export function useSavedPreferences() {
  const { value, update, enabled } = useCloudState<SavedPreferences>(KEY, DEFAULTS)
  return [value, update, enabled] as const
}
