import type { TimingPreference, TransportMode, TravelPreference } from '../lib/types'
import { useLocalStorageState } from './useLocalStorageState'

export interface SavedPreferences {
  cinemaSlugs: string[]
  timing: TimingPreference
  travel: TravelPreference
  transportMode: TransportMode | null
}

const KEY = 'cine-planer:saved-preferences'

const DEFAULTS: SavedPreferences = {
  cinemaSlugs: [],
  timing: 'standard',
  travel: 'minimal',
  transportMode: null,
}

export function useSavedPreferences() {
  return useLocalStorageState<SavedPreferences>(KEY, DEFAULTS)
}
