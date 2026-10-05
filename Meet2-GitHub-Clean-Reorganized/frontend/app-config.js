/* Meet 2 — Step 26: Two-backend service configuration.
 *
 * Architecture:
 *   Form 5 generation  -> FORM5 backend (local during development)
 *   Main product APIs  -> P2/Gagan deployed backend
 *
 * Replace form5 baseUrl with the deployed Form 5 service URL when that
 * service is deployed. Keep API keys on the backend, never in this file.
 */
window.MEET2_API = {
  useMockApi: false,
  // Form 5 may fall back to the local deterministic question generator if its
  // dedicated Gemini service is unavailable. This does NOT apply to roadmap generation.
  allowForm5LocalFallback: true,
  // Keep this false: the main roadmap API must never silently use mock routes.
  allowLocalRouteFallback: false,

  services: {
    // Our tested Dynamic Form 5 Gemini backend.
    // Local for now; can later be replaced by its deployed HTTPS URL.
    form5: 'http://127.0.0.1:5000',

    // P2/Gagan's deployed main Meet 2 backend.
    main: 'https://meet-2-2emg.onrender.com'
  },

  endpoints: {
    generateForm5: '/api/generate-form5',

    submitProfile: '/api/submit',
    generateRoadmap: '/api/generate-roadmap',
    currentMission: '/api/mission/current',
    completeMission: '/api/mission/complete',
    copilot: '/api/copilot',
    progress: '/api/progress'
  }
};
