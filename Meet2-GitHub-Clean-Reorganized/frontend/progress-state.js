/* Meet 2 — Step 10 Unified Progress State
 * Single source of truth for Roadmap + Daily Mission progress.
 * Temporary localStorage implementation; later P2 can replace the storage calls with API calls.
 */
(function () {
  const STORAGE_PREFIX = 'meet2_progress_v1_';
  const LEGACY_ROADMAP_PREFIX = 'meet2_roadmap_progress_';
  const LEGACY_MISSION_PREFIX = 'meet2_mission_checks_';

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`[Meet2Progress] Could not read ${key}`, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[Meet2Progress] Could not write ${key}`, error);
      return false;
    }
  }

  function storageKey(routeId) {
    return `${STORAGE_PREFIX}${routeId}`;
  }

  function createEmpty(routeId) {
    return {
      version: 1,
      routeId,
      completed: [],
      missionChecks: {},
      lastCompletedMission: null,
      updatedAt: null
    };
  }

  function normalize(progress, routeId, milestoneCount) {
    const next = {
      ...createEmpty(routeId),
      ...(progress || {})
    };

    next.routeId = routeId;
    next.version = 1;
    next.completed = Array.from(
      new Set(
        (Array.isArray(next.completed) ? next.completed : [])
          .map(Number)
          .filter(index => Number.isInteger(index) && index >= 0 && index < milestoneCount)
      )
    ).sort((a, b) => a - b);

    next.missionChecks = next.missionChecks && typeof next.missionChecks === 'object'
      ? next.missionChecks
      : {};

    return next;
  }

  function migrateLegacy(routeId, milestoneCount) {
    const migrated = createEmpty(routeId);
    let found = false;

    const oldRoadmap = readJSON(`${LEGACY_ROADMAP_PREFIX}${routeId}`, null);
    if (oldRoadmap && Array.isArray(oldRoadmap.completed)) {
      migrated.completed = oldRoadmap.completed;
      found = true;
    }

    for (let index = 0; index < milestoneCount; index += 1) {
      const oldChecks = readJSON(`${LEGACY_MISSION_PREFIX}${routeId}_${index}`, null);
      if (Array.isArray(oldChecks)) {
        migrated.missionChecks[String(index)] = oldChecks.map(Boolean);
        found = true;
      }
    }

    const oldLast = readJSON('meet2_last_completed_mission', null);
    if (oldLast && oldLast.routeId === routeId) {
      migrated.lastCompletedMission = oldLast;
      found = true;
    }

    if (!found) return null;

    migrated.updatedAt = new Date().toISOString();
    return normalize(migrated, routeId, milestoneCount);
  }

  function load(routeId, milestoneCount) {
    const current = readJSON(storageKey(routeId), null);
    if (current) {
      const normalized = normalize(current, routeId, milestoneCount);
      writeJSON(storageKey(routeId), normalized);
      return normalized;
    }

    const migrated = migrateLegacy(routeId, milestoneCount);
    const progress = migrated || createEmpty(routeId);
    writeJSON(storageKey(routeId), progress);
    return progress;
  }

  function save(routeId, progress, milestoneCount) {
    const normalized = normalize(progress, routeId, milestoneCount);
    normalized.updatedAt = new Date().toISOString();
    writeJSON(storageKey(routeId), normalized);
    return normalized;
  }

  function getCurrentIndex(route, progress) {
    return route.milestones.findIndex((_, index) => !progress.completed.includes(index));
  }

  function getMissionChecks(progress, index) {
    const checks = progress.missionChecks[String(index)];
    return Array.isArray(checks) ? checks.map(Boolean) : [];
  }

  function setMissionChecks(routeId, progress, index, checks, milestoneCount) {
    progress.missionChecks[String(index)] = checks.map(Boolean);
    return save(routeId, progress, milestoneCount);
  }

  function completeMilestone(routeId, progress, index, meta, milestoneCount) {
    if (!progress.completed.includes(index)) {
      progress.completed.push(index);
    }

    progress.completed.sort((a, b) => a - b);
    delete progress.missionChecks[String(index)];
    progress.lastCompletedMission = {
      routeId,
      index,
      title: meta?.title || `Milestone ${index + 1}`,
      targetRole: meta?.targetRole || 'Career Explorer',
      completedAt: new Date().toISOString()
    };

    return save(routeId, progress, milestoneCount);
  }

  window.Meet2Progress = {
    load,
    save,
    getCurrentIndex,
    getMissionChecks,
    setMissionChecks,
    completeMilestone,
    storageKey
  };
})();
