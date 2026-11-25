// Chat with the bot in your terminal. No Twilio, no ngrok. Great for building questions.
const readline = require('readline');
const { newSession, handle } = require('../src/engine');
let s = newSession();
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const show = rs => rs.forEach(r => console.log('\n\x1b[32mBOT:\x1b[0m ' + r));
show(handle(s, 'hi').replies);
rl.on('line', line => { const r = handle(s, line); s = r.s; show(r.replies); });
