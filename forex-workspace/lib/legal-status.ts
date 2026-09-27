// Publication approved by the operator on 27 September 2026.
export const LEGAL_STATUS='approved' as const;
export const TERMS_VERSION='terms-1.0';
export const PRIVACY_VERSION='privacy-1.0';
export const canSubmitAnalysis=()=>LEGAL_STATUS==='approved';
export const hasCurrentAcceptance=(accepted:unknown,terms:unknown,privacy:unknown)=>accepted==='yes'&&terms===TERMS_VERSION&&privacy===PRIVACY_VERSION;
