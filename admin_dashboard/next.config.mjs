import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

export default (phase) => ({
  // Keep local development from overwriting a production build being verified.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});
