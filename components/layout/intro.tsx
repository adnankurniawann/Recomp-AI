import { FullLogo } from "./logo";

/**
 * Runs before first paint: marks the intro as seen for this tab, or hides it if it already played.
 * Inline so a repeat visit never flashes the overlay before hydration.
 */
export const INTRO_SCRIPT = `try{var k="recomp-intro";if(sessionStorage.getItem(k)){document.documentElement.dataset.intro="seen"}else{sessionStorage.setItem(k,"1")}}catch(e){document.documentElement.dataset.intro="seen"}`;

/**
 * Brand intro on the first page of a visit: the blue r assembles (stem rises, shoulder joins), then
 * "ecomp ai" slides out from behind it, and the overlay fades away (about 1.8 s). The page renders
 * underneath the whole time. Hidden for repeat visits in the same tab and with reduced motion
 * (styles in app/globals.css).
 */
export function Intro() {
  return (
    <div aria-hidden className="intro fixed inset-0 z-50 flex items-center justify-center bg-bg">
      <FullLogo
        className="h-16 max-w-[80vw] sm:h-20"
        stemClassName="intro-stem"
        shoulderClassName="intro-shoulder"
        wordmarkClassName="intro-wordmark"
      />
    </div>
  );
}
