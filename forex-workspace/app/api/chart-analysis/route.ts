import {env} from 'cloudflare:workers';
import {chartAnalysisSchema,CHART_PROMPT,imageType} from '../../../lib/chart-analysis';
const headers={'Cache-Control':'no-store'};
let busy=false, attempts:number[]=[];
const config=()=>env as Record<string,string|undefined>;
export async function GET(){return Response.json({configured:!!config().OPENAI_API_KEY}, {headers});}
export async function POST(request:Request){
 const origin=request.headers.get('origin');
 if(origin!==new URL(request.url).origin) return Response.json({error:'Use the chart upload form in Meridian.'},{status:403,headers});
 if(!config().OPENAI_API_KEY) return Response.json({error:'AI analysis needs an OpenAI API key. Add OPENAI_API_KEY to the local .dev.vars file, then restart the server.'},{status:503,headers});
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
  const file=form.get('image'), context=form.get('context');
  if(!file||typeof file==='string'||file.size>5*1024*1024||file.size===0||typeof context!=='string'||context.length>500) return Response.json({error:'Choose a PNG, JPEG or WebP image under 5 MB. Context must be under 500 characters.'},{status:400,headers});
  const bytes=new Uint8Array(await file.arrayBuffer()),mime=imageType(bytes);
  if(!mime||mime!==file.type) return Response.json({error:'Unsupported image. Use PNG, JPEG or WebP.'},{status:400,headers});
  attempts.push(now);
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.slice(i,i+8192));
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${config().OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(60000),body:JSON.stringify({model:config().OPENAI_VISION_MODEL||'gpt-4.1-mini',store:false,instructions:CHART_PROMPT,max_output_tokens:2200,text:{format:{type:'json_object'}},input:[{role:'user',content:[{type:'input_text',text:'Analyze this chart. User-supplied context (may be incomplete): '+context},{type:'input_image',image_url:`data:${mime};base64,${btoa(binary)}`,detail:'high'}]}]})});
  if(!response.ok)return Response.json({error:response.status===429?'OpenAI usage limit reached. Check API billing or try later.':'OpenAI could not analyze the chart. Check the server API key and model access.'},{status:502,headers});
  const data=await response.json() as {status?:string;output?:{content?:{type:string;text?:string}[]}[]};
  if(data.status!=='completed')throw new Error('Incomplete response');
  const output=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text||'').join('');
  const result=chartAnalysisSchema.parse(JSON.parse(output));
  return Response.json({analysis:result,analyzedAt:new Date().toISOString()},{headers});
 }catch{return Response.json({error:'Analysis was unavailable, timed out, or contained inconsistent levels. Try a clearer screenshot.'},{status:502,headers});}
 finally{busy=false;}
}
