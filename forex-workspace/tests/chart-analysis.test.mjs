import test from 'node:test';
import assert from 'node:assert/strict';
import {chartAnalysisSchema,imageType} from '../lib/chart-analysis.ts';
const setup={direction:'long',strategy:'Support bounce',entry:1.1,stopLoss:1.09,takeProfit:1.12,trigger:'Close above resistance',invalidation:'Support breaks',evidence:'Visible range'};
const result={readable:true,summary:'Conditional scenario',observations:['Support is visible'],limitations:['Screenshot is historical'],setups:[setup]};
test('accepts conditional long and short levels',()=>{assert.equal(chartAnalysisSchema.parse(result).setups.length,1);assert.ok(chartAnalysisSchema.safeParse({...result,setups:[{...setup,direction:'short',stopLoss:1.12,takeProfit:1.09}]}).success);});
test('rejects inverted, zero-risk, unreadable and nonfinite levels',()=>{for(const s of [{...setup,stopLoss:1.11},{...setup,stopLoss:1.1},{...setup,entry:Infinity},{...setup,takeProfit:-1}])assert.equal(chartAnalysisSchema.safeParse({...result,setups:[s]}).success,false);assert.equal(chartAnalysisSchema.safeParse({...result,readable:false}).success,false);});
test('allows honest no-setup result',()=>{assert.ok(chartAnalysisSchema.safeParse({...result,readable:false,setups:[]}).success);});
test('recognizes supported signatures and rejects other files',()=>{assert.equal(imageType(new Uint8Array([137,80,78,71,13,10,26,10,0])),'image/png');assert.equal(imageType(new Uint8Array([255,216,255,0])),'image/jpeg');assert.equal(imageType(new TextEncoder().encode('<svg>image</svg>')),null);});
