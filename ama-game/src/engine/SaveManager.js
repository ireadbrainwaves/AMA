const SAVE_KEY = 'ama_run_save';

export function saveRun(state) {
  // Save all run state to localStorage
  // Only save if player is in a saveable screen (overworld, harvest — NOT mid-fight)
  try {
    const saveData = {
      version: 1,
      timestamp: Date.now(),
      screen: state.screen,
      playerCharKey: state.playerCharKey,
      playerMoves: state.playerMoves,
      mutations: state.mutations,
      biomass: state.biomass,
      credits: state.credits,
      techPoints: state.techPoints,
      playerTech: state.playerTech,
      items: state.items,
      arenaStates: state.arenaStates,
      arenasCleared: state.arenasCleared,
      currentArena: state.currentArena,
      runStats: state.runStats,
      scars: state.scars,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadRun() {
  // Load saved run, return null if none
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.version || !data.playerCharKey) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export function hasSavedRun() {
  // Check if a save exists
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!(data.version && data.playerCharKey);
  } catch (e) {
    return false;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {}
}

export function getSaveInfo() {
  // Get save summary for UI display
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.version || !data.playerCharKey) return null;
    return {
      playerCharKey: data.playerCharKey,
      arenasCleared: data.arenasCleared || 0,
      timestamp: data.timestamp,
      mutations: data.mutations?.length || 0,
    };
  } catch (e) {
    return null;
  }
}
