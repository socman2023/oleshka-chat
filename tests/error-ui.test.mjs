import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('all inline browser scripts parse without syntax errors',()=>{
 const scripts=[...html.matchAll(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/g)]
  .map(x=>x[1]).filter(Boolean);
 assert.equal(scripts.length,2);
 for(const source of scripts) assert.doesNotThrow(()=>new Function(source));
});
test('the exact Oleshka service address and chat history are preserved',()=>{
 assert(html.includes('https://oleshka-chat-api.boysinger2008.workers.dev/api/chat'));
 assert(html.includes('oleshka-native-chat-v1'));
 assert(html.includes('vkLaunch'));
});
test('Gemini and Cloudflare errors become in-character notices, not raw errors',()=>{
 assert(html.includes("const data = await response.json().catch(()=>null)"));
 assert(html.includes("addNotice(FAILURE_NOTICE)"));
 assert(html.includes("conversation.push({role:'notice',text})"));
 assert(html.includes("m.role==='user'||m.role==='model'"));
 assert(html.includes("data?.error === 'quota_exhausted'"));
 assert(!html.includes("showError(error.message)"));
});
test('the input automatically unlocks after the server-announced reset time',()=>{
 assert(html.includes('function applyLimitLock()'));
 assert(html.includes('unlockTimer = setTimeout(applyLimitLock'));
 assert(html.includes('window.addEventListener(\'focus\',applyLimitLock)'));
 assert(html.includes('if (limitUntil) {limitUntil=0;save();}'));
});
