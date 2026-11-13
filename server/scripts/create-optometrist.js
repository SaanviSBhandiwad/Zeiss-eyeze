// Create (or promote) an optometrist account in Supabase.
// Usage: npm run create-optometrist -- <email> <password> "<name>" ["<qualification>"] ["<hub>"]
import { admin } from '../services/supabase.js';

const [email, password, name, qualification = 'B.Optom', hub = 'Bengaluru hub'] = process.argv.slice(2);
if (!admin) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in server/.env first.'); process.exit(1); }
if (!email || !password || !name) { console.error('Usage: npm run create-optometrist -- <email> <password> "<name>"'); process.exit(1); }

let { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
let id = data?.user?.id;
if (error) {
  // Already exists? Find the user and reuse it.
  const list = await admin.auth.admin.listUsers({ perPage: 1000 });
  id = list.data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())?.id;
  if (!id) { console.error(error.message); process.exit(1); }
}
({ error } = await admin.from('optometrists').upsert({ id, name, qualification, hub }));
if (error) { console.error(error.message); process.exit(1); }
console.log(`Optometrist ready: ${name} <${email}> (${id})`);
