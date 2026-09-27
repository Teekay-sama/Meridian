import {chartAnalysisSchema,CHART_PROMPT,imageType} from '../../../lib/chart-analysis';
import {canSubmitAnalysis,hasCurrentAcceptance} from '../../../lib/legal-status';
const headers={'Cache-Control':'no-store'};
let busy=false, attempts:number[]=[];
const config=()=>process.env;
export async function GET(){return Response.json({configured:!!config().GROQ_API_KEY}, {headers});}
export async function POST(request:Request){
 if(!canSubmitAnalysis()) return Response.json({error:"AI reviews are temporarily unavailable."},{status:403,headers});
 const origin=request.headers.get('origin');
 const expectedOrigin=process.env.RENDER_EXTERNAL_HOSTNAME ? 'https://'+process.env.RENDER_EXTERNAL_HOSTNAME : new URL(request.url).origin;
 if(origin!==expectedOrigin) return Response.json({error:'Use the chart upload form in Meridian.'},{status:403,headers});
 if(!config().GROQ_API_KEY) return Response.json({error:'AI analysis is not configured. Contact the workspace administrator.'},{status:503,headers});
 if(Number(request.headers.get('content-length'))>6*1024*1024) return Response.json({error:'Image is too large. Maximum 5 MB.'},{status:413,headers});
 const now=Date.now(); attempts=attempts.filter(t=>now-t<60000);
 if(busy||attempts.length>=3) return Response.json({error:'Please wait before requesting another analysis.'},{status:429,headers});
 busy=true;
 try{
  // Bound the body even when Content-Length is absent or inaccurate.
  const reader=request.body?.getReader(); if(!reader) throw new Error('Missing image.');
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>6*1024*1024){await reader.cancel();return Response.json({error:'Image is too large. Maximum 5 MB.'},{status:413,headers});}chunks.push(value);}
  const form=await new Response(new Blob(chunks as BlobPart[]),{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData();
  if(!hasCurrentAcceptance(form.get('accepted'),form.get('termsVersion'),form.get('privacyVersion'))) return Response.json({error:'Please accept the current Terms and acknowledge the Privacy Notice before requesting a review.'},{status:403,headers});
  const file=form.get('image'), context=form.get('context');
  if(!file||typeof file==='string'||file.size>5*1024*1024||file.size===0||typeof context!=='string'||context.length>500) return Response.json({error:'Choose a PNG, JPEG or WebP image under 5 MB. Context must be under 500 characters.'},{status:400,headers});
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=imageType(bytes);
  if(!mime||mime!==file.type) return Response.json({error:'Unsupported image. Use PNG, JPEG or WebP.'},{status:400,headers});
  attempts.push(now);
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));
  const response=await fetch('https://api.groq.com/openai/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${config().GROQ_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model:config().GROQ_VISION_MODEL||'qwen/qwen3.8-27b',max_completion_tokens:2200,response_format:{type:'json_object'},messages:[{role:'system',content:CHART_PROMPT},{role:'user',content:[{type:'text',text:'Analyze this chart. User-supplied context (may be incomplete): '+context},{type:'image_url',image_url:{url:`data:${mime};base64,${btoa(binary)}`}}]}]})});
  if(!response.ok)return Response.json({error:response.status===429?'AI usage limit reached. Please try again later.':'AI analysis is unavailable. Please retry or contact the workspace administrator.'},{status:502,headers});
  const data=await response.json() as {choices?:{finish_reason?:string;message?:{content?:string}}[]};
  const choice=data.choices?.[0];
  if(choice?.finish_reason!=='stop'||!choice.message?.content)throw new Error('Incomplete response');
  const output=choice.message.content;
  const result=chartAnalysisSchema.parse(JSON.parse(output));
  return Response.json({analysis:result,analyzedAt:new Date().toISOString()},{headers});
 }catch{return Response.json({error:'Analysis was unavailable, timed out, or contained inconsistent levels. Try a clearer screenshot.'},{status:502,headers});}
 finally{busy=false;}
}
