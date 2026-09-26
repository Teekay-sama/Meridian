import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const command=process.argv[2];
if(!['dev','build','start'].includes(command))throw new Error('Expected dev, build or start');
// Local-only secret file. Render supplies secrets through environment variables.
if(existsSync('.dev.vars'))process.loadEnvFile('.dev.vars');
const args=[fileURLToPath(new URL('../node_modules/next/dist/bin/next',import.meta.url)),command];
if(command==='build'||command==='dev')args.push('--webpack');
if(command!=='build')args.push('--hostname',command==='start'?'0.0.0.0':'127.0.0.1','--port',process.env.PORT||'5173');
const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',e=>{console.error(e.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
