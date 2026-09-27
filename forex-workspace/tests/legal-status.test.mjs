import test from 'node:test';
import assert from 'node:assert/strict';
import {canSubmitAnalysis,hasCurrentAcceptance,TERMS_VERSION,PRIVACY_VERSION} from '../lib/legal-status.ts';
test('approved reviews require explicit confirmation of current documents',()=>{
 assert.equal(canSubmitAnalysis(),true);
 assert.equal(hasCurrentAcceptance('yes',TERMS_VERSION,PRIVACY_VERSION),true);
 for(const values of [[null,TERMS_VERSION,PRIVACY_VERSION],['no',TERMS_VERSION,PRIVACY_VERSION],['yes','terms-old',PRIVACY_VERSION],['yes',TERMS_VERSION,'privacy-old']]) assert.equal(hasCurrentAcceptance(...values),false);
});
