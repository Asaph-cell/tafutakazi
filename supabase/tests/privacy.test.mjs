// Runs the Tafutakazi migration in an in-process Postgres with small stand-ins for
// Supabase's auth and storage schemas, then checks the privacy rules.
import { PGlite } from '@electric-sql/pglite'
import fs from 'node:fs'

const dir = process.argv[2]
const migrations = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => fs.readFileSync(dir + '/' + f, 'utf8'))
const db = new PGlite()

const stubs = `
create role anon nologin; create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$
  select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema storage to authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant execute on function storage.foldername(text) to authenticated;
create schema vault;
create table vault.decrypted_secrets (name text, decrypted_secret text);
create schema net;
create table net.calls (url text, headers jsonb, body jsonb);
create function net.http_post(url text, headers jsonb, body jsonb) returns bigint language sql as $$
  insert into net.calls values (url, headers, body) returning 1::bigint $$;
create schema cron;
create table cron.jobs (name text, schedule text, command text);
create function cron.schedule(name text, schedule text, command text) returns bigint language sql as $$
  insert into cron.jobs values (name, schedule, command) returning 1::bigint $$;
`

let pass = 0, fail = 0
function ok(cond, label) { cond ? pass++ : fail++; console.log((cond ? 'PASS ' : 'FAIL ') + label) }
async function as(uid, fn) {
  await db.exec(uid === 'anon' ? `set role anon; select set_config('request.jwt.claim.sub', '', false);`
    : uid ? `set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`
    : `reset role; select set_config('request.jwt.claim.sub', '', false);`)
  try { return await fn() } finally { await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`) }
}
async function fails(p) { try { await p; return null } catch (e) { return e.message } }
const q = async (sql, params) => (await db.query(sql, params)).rows

await db.exec(stubs)
for (const m of migrations) await db.exec(m.replace('create extension if not exists pgcrypto;', '').replace('create extension if not exists pg_net;', '').replace('create extension if not exists pg_cron;', ''))
console.log('migration applied')

async function signUp(email, meta) {
  const [{ id }] = await q(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [email, meta])
  return id
}
const grad1 = await signUp('wanjiru@gmail.com', { role: 'grad', full_name: 'Wanjiru Kamau', course: 'BSc Statistics', institution: 'JKUAT', grad_year: '2026', track: 'Data Analyst' })
const grad2 = await signUp('brian@gmail.com', { role: 'grad', full_name: 'Brian Otieno', course: 'Economics', institution: 'UoN', grad_year: '2025', track: 'Data Analyst' })
const grad3 = await signUp('faith@gmail.com', { role: 'grad', full_name: 'Faith Chebet', course: 'Accounting', institution: 'KCA', grad_year: '', track: 'Accountant' })
const recA = await signUp('njeri@kamaulogistics.co.ke', { role: 'recruiter', full_name: 'Njeri Kamau', job_title: 'HR', company: 'Kamau & Co. Logistics', company_size: '11–50', industry: 'Logistics and transport', website: '', linkedin: '', social: '', roles: ['Data Analyst'] })
const recB = await signUp('shop@gmail.com', { role: 'recruiter', full_name: 'Otieno Shop', company: 'Gikomba Wholesale', industry: 'Retail and wholesale', roles: [] })
const recC = await signUp('hr@gmail.com', { role: 'recruiter', full_name: 'Pwani HR', company: 'Pwani Insurance', industry: 'Banking, SACCOs and insurance', social: 'instagram.com/pwani', roles: ['Accountant'] })

const [g1] = await q(`select * from public.grads where id = $1`, [grad1])
ok(g1 && /^wanjiru-kamau-[0-9a-f]{4}$/.test(g1.slug), 'grad sign-up creates profile and slug: ' + g1?.slug)
ok((await q(`select grad_year from public.grads where id = $1`, [grad3]))[0].grad_year === null, 'empty grad year stored as null')
const [cA] = await q(`select c.* from public.companies c join public.recruiters r on r.company_id = c.id where r.id = $1`, [recA])
ok(cA.email_domain === 'kamaulogistics.co.ke', 'company email domain recorded')
const [cB] = await q(`select c.* from public.companies c join public.recruiters r on r.company_id = c.id where r.id = $1`, [recB])
ok(cB.email_domain === null, 'gmail is not treated as a company domain')

// Tasks
const task = { role: 'Data Analyst', title: 'Delivery times dashboard', instructions: 'Find which routes are late most often and build a one-page dashboard.', minutes_estimate: 180 }
const ins = (t) => q(`insert into public.tasks (role, title, instructions, minutes_estimate, status) values ($1,$2,$3,$4,$5) returning id, industry, company_id`, [t.role, t.title, t.instructions, t.minutes_estimate, t.status ?? 'checking'])
const [t1] = await as(recA, () => ins(task))
ok(t1.industry === 'Logistics and transport' && t1.company_id === cA.id, 'recruiter posts a task; company and industry filled in')
ok(/automatic check/.test(await as(recA, () => fails(ins({ ...task, status: 'live' }))) ?? ''), 'recruiter cannot post a task straight to live')
ok(/company email, website/.test(await as(recB, () => fails(ins(task))) ?? ''), 'recruiter with Gmail and no links cannot post')
ok((await as(recC, () => fails(ins({ ...task, role: 'Accountant' })))) === null, 'recruiter with Gmail + social page can post')
ok(/automatic check/.test(await as(recA, () => fails(q(`update public.tasks set status = 'live' where id = $1`, [t1.id]))) ?? ''), 'recruiter cannot switch own task to live')
for (let k = 0; k < 3; k++) await as(recA, () => ins({ ...task, title: 'Task ' + k }))
ok(/open task limit/.test(await as(recA, () => fails(ins({ ...task, title: 'Fifth' }))) ?? ''), '5th open task blocked (limit 4)')
await as(recA, () => q(`update public.tasks set status = 'off' where title = 'Task 2'`))
ok((await as(recA, () => fails(ins({ ...task, title: 'After turning one off' })))) === null, 'turning a task off frees a slot')

// Server (automatic check) puts the first task live.
await q(`update public.tasks set status = 'live' where id = $1`, [t1.id])
ok((await as(grad1, () => q(`select status from public.tasks`))).every((r) => r.status === 'live'), 'graduates see only live tasks')
ok((await as(grad1, () => q(`select id from public.tasks where company_id is null`))).length === 19, 'nineteen practice tasks are live')
ok((await as(recC, () => q(`select id from public.tasks where id = $1`, [t1.id]))).length === 1, 'other recruiters see live tasks')
ok((await as(recC, () => q(`select name from public.companies`))).every((r) => r.name === 'Pwani Insurance'), 'recruiters cannot read other companies’ names')
ok((await as(grad1, () => q(`select name from public.companies`))).length === 3, 'graduates can see company names (to trust tasks)')

// Submissions
const words = (n) => Array.from({ length: n }, (_, k) => 'word' + k).join(' ')
const submit = (taskId, gid, n) => q(`insert into public.submissions (task_id, grad_id, summary, work_link, video_url, writeup) values ($1,$2,$3,$4,$5,$6) returning id`,
  [taskId, gid, 'Found the three routes late most often.', 'https://drive.google.com/x', 'https://loom.com/share/y', words(n)])
ok(/writeup/.test(await as(grad1, () => fails(submit(t1.id, grad1, 120))) ?? ''), 'write-up under 250 words is rejected')
const [s1] = await as(grad1, () => submit(t1.id, grad1, 260))
ok(Boolean(s1?.id), 'graduate submits work with a 260-word write-up')
ok(/row-level security|violates/.test(await as(grad2, () => fails(submit(t1.id, grad1, 260))) ?? ''), 'a graduate cannot submit in someone else’s name')
ok((await as(grad2, () => q(`select id from public.submissions`))).length === 0, 'other graduates cannot see the work')
ok((await as(recC, () => q(`select id, video_url from public.submissions`))).length === 1, 'recruiters can see the work')
ok(/permission denied/.test(await as(recC, () => fails(q(`select work_link from public.submissions`))) ?? ''), 'recruiters cannot read the full-work link column')
ok((await as(recC, () => q(`select public.get_work_link($1) as l`, [s1.id])))[0].l === null, 'full-work link hidden before an invite')
await as(recC, () => q(`insert into public.invites (submission_id, company_id, recruiter_id) select $1, company_id, id from public.recruiters where id = $2`, [s1.id, recC]))
ok((await as(recC, () => q(`select public.get_work_link($1) as l`, [s1.id])))[0].l === 'https://drive.google.com/x', 'full-work link revealed after inviting')
ok((await as(recA, () => q(`select public.get_work_link($1) as l`, [s1.id])))[0].l === null, 'another company still cannot see the link')
ok((await q(`select count(*)::int as n from public.views where kind = 'full_work_link'`))[0].n === 1, 'opening the link is logged')

// Feedback
await as(recC, () => q(`insert into public.comments (submission_id, recruiter_id, body) values ($1, $2, 'Great catch.')`, [s1.id, recC]))
await as(recC, () => q(`insert into public.reactions (submission_id, recruiter_id) values ($1, $2)`, [s1.id, recC]))
const seen = await as(grad1, () => q(`select cm.body, c.name from public.comments cm join public.companies c on c.id = cm.company_id`))
ok(seen.length === 1 && seen[0].name === 'Pwani Insurance', 'graduate sees the comment and which company wrote it')
ok((await as(grad2, () => q(`select * from public.comments`))).length === 0, 'other graduates cannot see the comment')

// Public CV page
await q(`insert into public.verdicts (submission_id, strengths, improve) values ($1, 'Clear dashboard.', 'Bigger labels.')`, [s1.id])
const [pp] = await as('anon', () => q(`select public.get_public_profile($1) as p`, [g1.slug]))
const text = JSON.stringify(pp.p)
ok(pp.p.full_name === 'Wanjiru Kamau' && pp.p.thumbs === 1 && pp.p.invites === 1 && pp.p.tasks.length === 1, 'public page shows name, counts and tasks')
ok(!text.includes('drive.google') && !text.includes('loom.com') && !text.includes('word1'), 'public page never includes the work, video or write-up')
ok(pp.p.tasks[0].industry === 'Logistics and transport', 'public page shows industry, not company name')
ok(/permission denied/.test(await as('anon', () => fails(q(`select * from public.grads`))) ?? ''), 'anonymous visitors cannot read tables directly')

// Reports pause a task after three.
for (const g of [grad1, grad2, grad3]) await as(g, () => q(`insert into public.reports (task_id, grad_id, reason) values ($1, $2, 'Looks like real client data')`, [t1.id, g]))
ok((await q(`select status from public.tasks where id = $1`, [t1.id]))[0].status === 'flagged', 'three reports pause the task')

// Storage paths
const up = (uid, bucket, name) => as(uid, () => fails(q(`insert into storage.objects (bucket_id, name) values ($1, $2)`, [bucket, name])))
ok((await up(grad1, 'previews', `${grad1}/preview.pdf`)) === null, 'graduate uploads a preview into their own folder')
ok((await up(grad1, 'previews', `${grad2}/preview.pdf`)) !== null, 'graduate cannot upload into someone else’s folder')
ok((await up(recA, 'previews', `${recA}/x.pdf`)) !== null, 'recruiters cannot upload previews')

// Phase 2: task feed, records, keeping access to past work, deleting an account
const feed = await as(grad2, () => q(`select * from public.task_feed()`))
ok(feed.length >= 3 && feed.some((t) => t.is_practice), 'graduates get the task feed, including practice tasks')
ok((await as(recA, () => q(`select * from public.task_feed()`))).length === 0, 'recruiters do not get the graduate task feed')
const files = await as(grad2, () => q(`select public_url from public.task_files where public_url is not null`))
ok(files.length === 15, 'practice data files are listed (3 versions × 5 data tasks)')
const [t2] = await as(recC, () => q(`select id from public.tasks where company_id = public.my_company() limit 1`))
await q(`update public.tasks set status = 'live' where id = $1`, [t2.id])
const [s2] = await as(grad2, () => submit(t2.id, grad2, 300))
await as(recC, () => q(`select public.log_view($1)`, [s2.id]))
const rec = (await as(grad2, () => q(`select record from public.task_feed($1)`, [t2.id])))[0].record
ok(rec.received === 1 && rec.viewed === 1 && rec.feedback === 0, 'company record counts received, viewed and feedback')
await as(recC, () => q(`update public.tasks set status = 'off' where id = $1`, [t2.id]))
ok((await as(grad2, () => q(`select title from public.tasks where id = $1`, [t2.id]))).length === 1, 'a graduate still sees a task they did after it is turned off')
ok((await as(grad1, () => q(`select title from public.tasks where id = $1`, [t2.id]))).length === 0, 'other graduates no longer see the turned-off task')
await as(grad3, () => q(`select public.delete_my_account()`))
ok((await q(`select count(*)::int as n from public.profiles where id = $1`, [grad3]))[0].n === 0, 'a graduate can delete their account and profile')

// Admin area
const admin = await signUp('admin@tafutakazi.co.ke', { role: 'grad', full_name: 'Tafutakazi Admin', course: 'x', institution: '', grad_year: '', track: 'Data Analyst' })
await q(`update public.profiles set role = 'admin' where id = $1`, [admin])
const [pt] = await as(admin, () => q(`insert into public.tasks (role, title, instructions, minutes_estimate, status) values ('HR', 'Shortlist five CVs', 'Read the five CVs and explain who you would interview and why.', 120, 'live') returning id, company_id, status`))
ok(pt.company_id === null && pt.status === 'live', 'admin adds a practice task that goes live straight away')
const [waiting] = await as(recA, () => q(`select id from public.tasks where status = 'checking' limit 1`))
await as(admin, () => q(`update public.tasks set status = 'live' where id = $1`, [waiting.id]))
ok((await q(`select status from public.tasks where id = $1`, [waiting.id]))[0].status === 'live', 'admin approves a company task')
ok((await as(admin, () => q(`select id from public.submissions`))).length >= 1, 'admin sees submissions to review')
ok((await as(admin, () => q(`select public.get_work_link($1) as l`, [s2.id])))[0].l === 'https://drive.google.com/x', 'admin can open the full work to review it')
ok((await as(admin, () => fails(q(`insert into public.verdicts (submission_id, strengths, improve) values ($1, 'Clear.', 'Shorter.')`, [s2.id])))) === null, 'admin writes a verdict')
ok((await as(recA, () => fails(q(`update public.verdicts set strengths = 'x'`)))) === null && (await q(`select strengths from public.verdicts where submission_id = $1`, [s2.id]))[0].strengths === 'Clear.', 'recruiters cannot change verdicts')
ok(/permission denied/.test(await as(recA, () => fails(q(`insert into public.verdicts (submission_id, strengths, improve) values ($1, 'a', 'b')`, [s1.id]))) ?? '') || /row-level/.test(await as(recA, () => fails(q(`insert into public.verdicts (submission_id, strengths, improve) values ($1, 'a', 'b')`, [s1.id]))) ?? ''), 'recruiters cannot write verdicts')
ok(/permission denied/.test(await as('anon', () => fails(q(`select * from public.task_feed()`))) ?? ''), 'anonymous visitors cannot call the task feed')
ok((await as(grad1, () => q(`select public.is_admin() as a`)))[0].a === false, 'a graduate is not an admin')

// Phase 3: recruiter side
const browse = await as(recC, () => q(`select * from public.browse_grads('Data Analyst')`))
const wanjiru = browse.find((b) => b.grad_id === grad1)
ok(wanjiru && wanjiru.tasks_done === 1 && wanjiru.thumbs === 1 && wanjiru.latest_strengths === 'Clear dashboard.', 'browse lists graduates with work in the role, with counts and verdict')
ok((await as(grad2, () => q(`select * from public.browse_grads('Data Analyst')`))).length === 0, 'graduates cannot use the browse list')
const workC = (await as(recC, () => q(`select public.grad_work($1) as w`, [grad1])))[0].w
const workA = (await as(recA, () => q(`select public.grad_work($1) as w`, [grad1])))[0].w
ok(workC.email === 'wanjiru@gmail.com', 'a company that invited the graduate sees their email')
ok(workA.email === null, 'a company that has not invited them does not see the email')
ok(workC.submissions[0].my_company_name === null && workC.submissions[0].industry === 'Logistics and transport', 'other companies see the industry, not the name, of the task')
ok(workA.submissions[0].my_company_name === 'Kamau & Co. Logistics' && workA.submissions[0].is_mine, 'the company that set the task sees its own name')
ok(!JSON.stringify(workC).includes('drive.google'), 'the full-work link is never in the work view')
ok(workC.submissions[0].invited === true && workA.submissions[0].invited === false, 'each company sees only its own invite state')
ok((await as(grad2, () => q(`select public.grad_work($1) as w`, [grad1])))[0].w === null, 'graduates cannot open another graduate’s work view')
const mine = await as(recA, () => q(`select * from public.my_tasks()`))
ok(mine.some((t) => t.id === t1.id && t.received === 1), 'my tasks shows how much work each task received')
ok((await as(recC, () => q(`select * from public.task_submissions($1)`, [t1.id]))).length === 0, 'a company cannot list who did another company’s task')
ok((await as(recA, () => q(`select * from public.task_submissions($1)`, [t1.id])))[0]?.full_name === 'Wanjiru Kamau', 'a company lists who did its own task')
ok((await as(recB, () => q(`select public.my_task_allowance() as a`)))[0].a.can_post === false, 'a recruiter without proof is told they cannot post yet')
ok((await as(recA, () => q(`select public.my_task_allowance() as a`)))[0].a.limit === 4, 'task allowance reports the limit')

// Skills by tool
await as(grad1, () => q(`update public.submissions set tools = '{"Power BI","Excel"}' where id = $1`, [s1.id]))
const pbi = await as(recC, () => q(`select grad_id, tools from public.browse_grads('Data Analyst', '{"power bi"}')`))
ok(pbi.length === 1 && pbi[0].grad_id === grad1 && pbi[0].tools.includes('Power BI'), 'recruiters filter graduates by tool (case doesn’t matter)')
ok((await as(recC, () => q(`select * from public.browse_grads('Data Analyst', '{"Power BI","Python"}')`))).length === 0, 'every chosen tool must have been used')
ok((await as(recC, () => q(`select * from public.browse_grads('Data Analyst')`))).length >= 1, 'no tool filter shows everyone in the role')
const tl = await as(recC, () => q(`select * from public.role_tools('Data Analyst')`))
ok(tl.some((t) => t.tool === 'Power BI' && t.grads === 1), 'tool chips list what graduates used in the role')
ok((await as(grad2, () => q(`select * from public.role_tools('Data Analyst')`))).length === 0, 'graduates cannot list tools across others’ work')
const pub = (await as('anon', () => q(`select public.get_public_profile($1) as p`, [g1.slug])))[0].p
ok(pub.tasks[0].tools.includes('Power BI'), 'the public CV page shows the tools used')
ok(/check/.test(await as(grad1, () => fails(q(`update public.submissions set tools = '{a,b,c,d,e,f,g,h,i}' where id = $1`, [s1.id]))) ?? ''), 'at most 8 tools per task')

// Public job board
const jobs = await as('anon', () => q(`select * from public.public_jobs()`))
ok(jobs.length >= 1 && jobs.every((j) => j.company_name), 'anyone can see live company jobs, with the company name')
ok((await q(`select count(*)::int as n from public.tasks where company_id is null and status = 'live'`))[0].n > 0 && jobs.every((j) => j.title !== 'Grocery chain sales dashboard'), 'practice tasks are not listed as jobs')
ok(jobs.every((j) => !('email_domain' in j)), 'the job board does not reveal company email domains')
const offTask = (await q(`select id from public.tasks where status = 'off' and company_id is not null limit 1`))[0]
ok(!offTask || (await as('anon', () => q(`select * from public.public_jobs($1)`, [offTask.id]))).length === 0, 'turned-off tasks are not listed')

// Task requests
const reqIns = (gid, details) => q(`insert into public.task_requests (grad_id, role, tools, details) values ($1, 'Data Analyst', '{"Power BI"}', $2) returning id`, [gid, details])
const [rq] = await as(grad1, () => reqIns(grad1, 'A Power BI dashboard task with sales data, please.'))
ok(Boolean(rq?.id), 'a graduate requests a practice task')
await as(grad1, () => reqIns(grad1, 'A second request about SQL joins.'))
await as(grad1, () => reqIns(grad1, 'A third request about forecasting.'))
ok(/up to 3/.test(await as(grad1, () => fails(reqIns(grad1, 'A fourth request that should be refused.'))) ?? ''), 'at most three open requests per graduate')
ok((await as(grad2, () => fails(reqIns(grad1, 'Pretending to be someone else.')))) !== null && (await q(`select count(*)::int as n from public.task_requests where details like 'Pretending%'`))[0].n === 0, 'a graduate cannot request in someone else’s name')
ok((await as(grad2, () => q(`select * from public.task_requests`))).length === 0, 'graduates see only their own requests')
ok((await as(recC, () => q(`select * from public.task_requests`))).length === 0, 'recruiters never see requests')
ok((await as(recC, () => fails(q(`insert into public.task_requests (grad_id, role, details) values ($1, 'HR', 'Recruiter trying to ask.')`, [recC])))) !== null, 'recruiters cannot make requests')
ok((await as(admin, () => q(`select * from public.task_requests`))).length === 3, 'admin sees every request')
await as(admin, () => q(`update public.task_requests set status = 'done', task_id = $2, answered_at = now() where id = $1`, [rq.id, pt.id]))
ok((await as(grad1, () => q(`select status, task_id from public.task_requests where id = $1`, [rq.id])))[0].status === 'done', 'the graduate sees their request answered with a task')
ok((await as(grad1, () => q(`update public.task_requests set status = 'done' where status = 'open' returning id`))).length === 0, 'graduates cannot mark their own requests done')

// Invite email
ok((await q(`select count(*)::int as n from net.calls`))[0].n === 0, 'no email is attempted before a Resend key is stored')
await q(`insert into vault.decrypted_secrets values ('resend_api_key', 're_test')`)
await q(`update public.profiles set full_name = 'Brian <b>Otieno</b>' where id = $1`, [grad2])
await as(recA, () => q(`insert into public.invites (submission_id, company_id, recruiter_id) select $1, company_id, id from public.recruiters where id = $2`, [s2.id, recA]))
const call = (await q(`select * from net.calls`))[0]
ok(call && call.body.to[0] === 'brian@gmail.com' && call.body.reply_to === 'njeri@kamaulogistics.co.ke', 'the invite email goes to the graduate, with replies going to the recruiter')
ok(call && call.body.subject === 'Kamau & Co. Logistics invited you to interview' && call.headers.Authorization === 'Bearer re_test', 'the email names the company and uses the stored key')
ok(call && call.body.html.includes('Brian &lt;b&gt;Otieno') === false && call.body.html.includes('Hi Brian'), 'the email greets the graduate by first name')
await q(`update public.profiles set full_name = 'Njeri <script>' where id = $1`, [recA])
await q(`delete from public.invites where submission_id = $1 and company_id = (select company_id from public.recruiters where id = $2)`, [s2.id, recA])
await as(recA, () => q(`insert into public.invites (submission_id, company_id, recruiter_id) select $1, company_id, id from public.recruiters where id = $2`, [s2.id, recA]))
const call2 = (await q(`select * from net.calls`))[1]
ok(call2 && call2.body.html.includes('Njeri &lt;script&gt;') && !call2.body.html.includes('<script>'), 'names are escaped in the email')
await q(`drop function net.http_post(text, jsonb, jsonb)`)
ok((await as(recA, () => fails(q(`insert into public.invites (submission_id, company_id, recruiter_id) select $1, company_id, id from public.recruiters where id = $2`, [s1.id, recA])))) === null, 'if email fails, the invite still saves')

// Invite follow-up: both sides' status, no-contact rules, nudges, record, pausing
await q(`create function net.http_post(url text, headers jsonb, body jsonb) returns bigint language sql as $$ insert into net.calls values (url, headers, body) returning 1::bigint $$`)
const [invA] = await q(`select i.id from public.invites i join public.submissions s on s.id = i.submission_id where s.grad_id = $1 and i.company_id = (select company_id from public.recruiters where id = $2)`, [grad2, recA])
ok(/Only the company/.test(await as(grad2, () => fails(q(`update public.invites set company_status = 'hired' where id = $1`, [invA.id]))) ?? ''), 'a graduate cannot change the company’s side of an invite')
ok(/Only the graduate/.test(await as(recA, () => fails(q(`update public.invites set grad_status = 'hired' where id = $1`, [invA.id]))) ?? ''), 'a company cannot change the graduate’s side')
ok(/5 days/.test(await as(grad2, () => fails(q(`update public.invites set grad_status = 'no_contact' where id = $1`, [invA.id]))) ?? ''), 'no contact can only be reported after 5 days')
await as(grad2, () => q(`update public.invites set grad_status = 'contacted' where id = $1`, [invA.id]))
ok((await q(`select grad_status, grad_updated_at from public.invites where id = $1`, [invA.id]))[0].grad_updated_at !== null, 'a graduate marks that the company contacted them')
ok((await as(recC, () => q(`update public.invites set company_status = 'hired' where id = $1 returning id`, [invA.id]))).length === 0, 'another company cannot touch the invite')

const before = (await q(`select count(*)::int as n from net.calls`))[0].n
await as(recA, () => q(`update public.invites set company_status = 'not_moving_forward' where id = $1`, [invA.id]))
const nmf = (await q(`select body from net.calls order by ctid desc limit 1`))[0].body
ok((await q(`select count(*)::int as n from net.calls`))[0].n === before + 1 && nmf.subject.startsWith('An update from') && nmf.to[0] === 'brian@gmail.com', 'not moving forward emails the graduate kindly')

// A stale invite gets one nudge.
await q(`update public.invites set created_at = now() - interval '4 days', company_status = 'invited' where id = $1`, [invA.id])
const sentN = (await q(`select public.send_invite_nudges() as n`))[0].n
const nudge = (await q(`select body from net.calls order by ctid desc limit 1`))[0].body
ok(sentN >= 1 && nudge.subject.startsWith('Have you contacted') && nudge.to[0] === 'njeri@kamaulogistics.co.ke', 'companies get a reminder after 3 days')
ok((await q(`select public.send_invite_nudges() as n`))[0].n === 0, 'each invite is nudged only once')
ok((await q(`select count(*)::int as n from cron.jobs where name = 'invite-nudges'`))[0].n === 1, 'the reminder runs every morning')

// Contact record shown to graduates.
const rec2 = (await q(`select public.company_record(company_id) as r from public.recruiters where id = $1`, [recA]))[0].r
ok(rec2.invited >= 1 && 'contacted' in rec2, 'the company record includes invites and contacts')

// Three graduates reporting no contact pause the company.
const coA = (await q(`select company_id from public.recruiters where id = $1`, [recA]))[0].company_id
const ghost = async (gid, email) => {
  const [t] = await q(`select id from public.tasks where company_id = $1 limit 1`, [coA])
  await q(`update public.tasks set status = 'live' where id = $1`, [t.id])
  const [sb] = await q(`insert into public.submissions (task_id, grad_id, summary, work_link, video_url, writeup) values ($1,$2,'A ghosting test summary.','https://x.co/a','https://x.co/v',$3) on conflict (task_id, grad_id) do update set summary = excluded.summary returning id`, [t.id, gid, words(260)])
  await q(`insert into public.invites (submission_id, company_id, recruiter_id, created_at) values ($1, $2, $3, now() - interval '6 days') on conflict (submission_id, company_id) do update set created_at = now() - interval '6 days', grad_status = 'waiting'`, [sb.id, coA, recA])
  const [iv] = await q(`select id from public.invites where submission_id = $1 and company_id = $2`, [sb.id, coA])
  await as(gid, () => q(`update public.invites set grad_status = 'no_contact' where id = $1`, [iv.id]))
}
const g4 = await signUp('g4@gmail.com', { role: 'grad', full_name: 'Grad Four', course: 'x', institution: '', grad_year: '', track: 'Data Analyst' })
const g5 = await signUp('g5@gmail.com', { role: 'grad', full_name: 'Grad Five', course: 'x', institution: '', grad_year: '', track: 'Data Analyst' })
await ghost(grad1); await ghost(g4)
ok((await q(`select paused from public.companies where id = $1`, [coA]))[0].paused === false, 'two no-contact reports do not pause a company')
await ghost(g5)
ok((await q(`select paused from public.companies where id = $1`, [coA]))[0].paused === true, 'three no-contact reports pause the company')
ok((await q(`select count(*)::int as n from public.tasks where company_id = $1 and status = 'live'`, [coA]))[0].n === 0, 'its live tasks are paused too')
ok((await as(recA, () => fails(q(`insert into public.invites (submission_id, company_id, recruiter_id) select $1, company_id, id from public.recruiters where id = $2`, [s1.id, recA])))) !== null, 'a paused company cannot invite')
ok(/Only Tafutakazi/.test(await as(recA, () => fails(q(`update public.companies set paused = false where id = $1`, [coA]))) ?? ''), 'a company cannot unpause itself')
await as(admin, () => q(`update public.companies set paused = false where id = $1`, [coA]))
ok((await q(`select paused from public.companies where id = $1`, [coA]))[0].paused === false, 'an admin can unpause after reviewing')
await as(g5, () => q(`update public.invites set grad_status = 'hired' where grad_status = 'no_contact'`))
ok((await as(admin, () => q(`select public.hire_count() as n`)))[0].n >= 1, 'hires are counted')

// Candidates and roles with work
const candA = await as(recA, () => q(`select * from public.my_candidates()`))
ok(candA.some((c) => c.kind === 'invited' && c.company_status && c.email) && candA.every((c) => c.kind === 'invited' || !c.email) && candA.every((c) => c.kind !== 'invited' || c.invite_id), 'a company sees everyone it invited, with statuses')
const candC = await as(recC, () => q(`select * from public.my_candidates()`))
ok(candC.every((c) => !candA.some((a) => a.invite_id && a.invite_id === c.invite_id)), 'companies never see each other’s candidates')
ok((await as(grad1, () => q(`select * from public.my_candidates()`))).length === 0, 'graduates have no candidates list')
const rw = await as(recC, () => q(`select * from public.roles_with_work()`))
ok(rw.some((r) => r.role === 'Data Analyst' && r.grads >= 1), 'browse knows which roles have work')
ok((await as(grad1, () => q(`select * from public.roles_with_work()`))).length === 0, 'graduates cannot list roles with work')

// Other work links
const linkIns = (gid, title, url) => q(`insert into public.grad_links (grad_id, title, url) values ($1, $2, $3) returning id`, [gid, title, url])
await as(grad1, () => linkIns(grad1, 'Church website I built', 'https://example.org'))
ok((await as(grad1, () => fails(linkIns(grad1, 'Bad link', 'javascript:alert(1)')))) !== null, 'only http links can be added')
ok((await as(grad2, () => fails(linkIns(grad1, 'Not mine', 'https://example.com')))) !== null, 'a graduate cannot add links to someone else')
ok((await as(recC, () => fails(linkIns(recC, 'Recruiter link', 'https://example.com')))) !== null, 'recruiters cannot add links')
for (let k = 0; k < 4; k++) await as(grad1, () => linkIns(grad1, `Project ${k}`, `https://example.com/${k}`))
ok((await as(grad1, () => fails(linkIns(grad1, 'Sixth', 'https://example.com/6')))) !== null, 'at most five links per graduate')
ok((await as(recC, () => q(`select * from public.grad_links where grad_id = $1`, [grad1]))).length === 5, 'recruiters see a graduate’s links')
ok((await as(grad2, () => q(`select * from public.grad_links where grad_id = $1`, [grad1]))).length === 0, 'other graduates cannot see them')
ok((await as(grad2, () => q(`delete from public.grad_links where grad_id = $1 returning id`, [grad1]))).length === 0, 'other graduates cannot delete them')

// Automatic task check (Gemini)
await q(`drop function net.http_post(text, jsonb, jsonb)`)
await q(`create sequence net.ids`)
await q(`create table net._http_response (id bigint, status_code int, content text, timed_out bool, error_msg text, created timestamptz default now())`)
await q(`create function net.http_post(url text, headers jsonb, body jsonb, timeout_milliseconds int default 5000) returns bigint language sql as $$
  insert into net.calls values (url, headers, body); select nextval('net.ids') $$`)
const newTask = async (title) => (await q(`insert into public.tasks (company_id, role, title, instructions, minutes_estimate) values ($1, 'Data Analyst', $2, 'Clean this sales file and build a one-page summary for the manager.', 120) returning id`, [coA, title]))[0].id
const tNoKey = await newTask('Before the key')
ok((await q(`select count(*)::int as n from public.ai_checks`))[0].n === 0, 'no AI check is attempted before a Gemini key is stored')
await q(`insert into vault.decrypted_secrets values ('gemini_api_key', 'g_test')`)
const tPass = await newTask('Sales summary')
const aiCall = (await q(`select * from net.calls order by ctid desc limit 1`))[0]
ok(aiCall.url.includes('generativelanguage.googleapis.com') && aiCall.headers['x-goog-api-key'] === 'g_test' && JSON.stringify(aiCall.body).includes('Sales summary'), 'a new company task is sent to Gemini')
ok(!JSON.stringify(aiCall.body).includes('wanjiru'), 'nothing about graduates is sent')
const reply = (verdict, reason) => JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ verdict, reason }) }] } }] })
const reqOf = async (t) => (await q(`select request_id from public.ai_checks where task_id = $1`, [t]))[0].request_id
await q(`insert into net._http_response (id, status_code, content) values ($1, 200, $2)`, [await reqOf(tPass), reply('pass', 'A fair analyst task.')])
const tReview = await newTask('Sell our phones')
await q(`insert into net._http_response (id, status_code, content) values ($1, 200, $2)`, [await reqOf(tReview), reply('review', 'Asks graduates to sell the company’s products.')])
const tErr = await newTask('Rate limited')
await q(`insert into net._http_response (id, status_code, content) values ($1, 429, '{"error":"quota"}')`, [await reqOf(tErr)])
const tWait = await newTask('No answer yet')
const emailsBefore = (await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n
await q(`select public.process_ai_checks()`)
const st = async (t) => (await q(`select status from public.tasks where id = $1`, [t]))[0].status
ok(await st(tPass) === 'live', 'a clear pass goes live by itself')
ok(await st(tReview) === 'checking', 'a doubtful task waits for the admin')
const adminMail = (await q(`select body from net.calls where url like '%resend%' order by ctid desc limit 1`))[0].body
ok((await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n === emailsBefore + 1 && adminMail.to[0] === 'admin@tafutakazi.co.ke' && adminMail.html.includes('sell the company'), 'the admin is emailed at their own address with the reason')
const busy = (await q(`select status, attempts, model from public.ai_checks where task_id = $1`, [tErr]))[0]
ok(await st(tErr) === 'checking' && busy.status === 'sent' && busy.attempts === 2 && busy.model === 'gemini-flash-lite-latest', 'a busy model is tried again with the lighter one')
for (let k = 0; k < 4; k++) {
  await q(`insert into net._http_response (id, status_code, content) values ($1, 503, '{"error":"busy"}')`, [await reqOf(tErr)])
  await q(`select public.process_ai_checks()`)
}
const gaveUp = (await q(`select status, attempts from public.ai_checks where task_id = $1`, [tErr]))[0]
ok(await st(tErr) === 'checking' && gaveUp.status === 'failed' && gaveUp.attempts === 5, 'after five tries the task waits for the admin')
const tBadKey = await newTask('Bad key')
await q(`insert into net._http_response (id, status_code, content) values ($1, 403, '{"error":"key"}')`, [await reqOf(tBadKey)])
await q(`select public.process_ai_checks()`)
ok((await q(`select status, attempts from public.ai_checks where task_id = $1`, [tBadKey]))[0].attempts === 1, 'a bad key is not retried')
ok(await st(tWait) === 'checking' && (await q(`select status from public.ai_checks where task_id = $1`, [tWait]))[0].status === 'sent', 'a task without an answer yet keeps waiting')
ok((await as(admin, () => q(`select reason from public.ai_checks where task_id = $1`, [tReview])))[0]?.reason.includes('sell'), 'the admin sees the AI’s reason')
ok((await as(recA, () => fails(q(`select public.reject_task($1, 'Not allowed to do this')`, [tReview])))) !== null && await st(tReview) === 'checking', 'recruiters cannot reject tasks')
ok((await as(admin, () => fails(q(`select public.reject_task($1, '')`, [tReview])))) !== null, 'a rejection needs a reason')
const beforeReject = (await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n
await as(admin, () => q(`select public.reject_task($1, 'It asks graduates to sell your products.')`, [tReview]))
const rejMail = (await q(`select body from net.calls where url like '%resend%' order by ctid desc limit 1`))[0].body
ok(await st(tReview) === 'off' && (await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n === beforeReject + 1 && rejMail.to[0] === 'njeri@kamaulogistics.co.ke' && rejMail.html.includes('sell your products') && rejMail.subject.includes('wasn'), 'rejecting turns the task off and emails the recruiter why')
ok((await q(`select check_notes from public.tasks where id = $1`, [tReview]))[0].check_notes.startsWith('Not approved'), 'the recruiter sees the reason on My tasks')
ok((await as(recA, () => q(`select * from public.ai_checks`))).length === 0, 'recruiters cannot see AI checks')
ok((await as(recA, () => fails(q(`select public.process_ai_checks()`)))) !== null, 'recruiters cannot run the check themselves')
ok((await q(`select count(*)::int as n from cron.jobs where name = 'ai-task-checks'`))[0].n === 1, 'answers are read every minute')

// Daily digests and the hires counter
const mailsBefore = (await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n
const digestN = (await q(`select public.send_digests() as n`))[0].n
const digests = (await q(`select body from net.calls where url like '%resend%'`)).map((r) => r.body).filter((b) => b.html.includes('daily Tafutakazi digest'))
ok(digestN > 0 && digests.length === digestN, 'digests are sent to people with something new')
const recDigest = digests.find((d) => d.to[0] === 'njeri@kamaulogistics.co.ke')
ok(recDigest && recDigest.html.includes('Wanjiru') && !recDigest.html.includes('Kamau ·') && !recDigest.html.includes('JKUAT') && !recDigest.html.includes('@gmail.com'), 'recruiter digests show first name and course only, no surname, university or email')
const writeups = (await q(`select writeup, summary from public.submissions`))
ok(digests.every((d) => writeups.every((w) => !d.html.includes(w.writeup.slice(0, 40)) && !d.html.includes(w.summary.slice(0, 40)))), 'digests never contain the work itself')
const commentBodies = (await q(`select body from public.comments`)).map((r) => r.body)
ok(commentBodies.length > 0 && digests.every((d) => commentBodies.every((c) => !d.html.includes(c))), 'digests never contain comment text')
ok(digests.every((d) => !/work_link|preview|supabase\.co/.test(d.html)), 'digests never link to files')
ok((await q(`select public.send_digests() as n`))[0].n === 0, 'nobody gets two digests in one day')
await q(`update public.grads set digest_sent_at = null`)
await q(`update public.recruiters set digest_sent_at = null`)
ok((await q(`select public.send_digests(1) as n`))[0].n === 1, 'digests stop at the daily limit')
await q(`update public.grads set digest_enabled = false, digest_sent_at = null`)
await q(`update public.recruiters set digest_enabled = false, digest_sent_at = null`)
ok((await q(`select public.send_digests() as n`))[0].n === 0, 'people who turned digests off get none')
ok((await as(recA, () => fails(q(`select public.send_digests()`)))) !== null, 'nobody can trigger digests from the site')
ok((await q(`select count(*)::int as n from cron.jobs where name = 'daily-digests'`))[0].n === 1, 'digests go out every morning')
ok(typeof (await as('anon', () => q(`select public.hire_count() as n`)))[0].n === 'number', 'anyone can see how many graduates were hired')

// Graduates can delete their own work
const [delSub] = await q(`select id from public.submissions where grad_id = $1 limit 1`, [grad1])
ok((await as(grad2, () => q(`delete from public.submissions where id = $1 returning id`, [delSub.id]))).length === 0, 'a graduate cannot delete someone else’s work')
ok((await as(recA, () => fails(q(`delete from public.submissions where id = $1 returning id`, [delSub.id])))) !== null || (await q(`select 1 from public.submissions where id = $1`, [delSub.id])).length === 1, 'recruiters cannot delete work')
ok((await as(grad1, () => q(`delete from public.submissions where id = $1 returning id`, [delSub.id]))).length === 1, 'a graduate can delete their own work')
ok((await q(`select (select count(*) from public.comments where submission_id = $1) + (select count(*) from public.reactions where submission_id = $1) + (select count(*) from public.invites where submission_id = $1) as n`, [delSub.id]))[0].n == 0, 'comments, thumbs up and invites on it go too')

// Opportunity types, screening questions, scoring guides and round 2
const coC = (await q(`select company_id from public.recruiters where id = $1`, [recC]))[0].company_id
const mk = (co, o) => q(`insert into public.tasks (company_id, role, title, instructions, minutes_estimate, status, kind, stipend, duration_months, hours_per_week, questions, rubric)
  values ($1, 'Data Analyst', $2, 'Analyse this file and write a short summary for the manager.', 120, 'live', $3, $4, $5, $6, $7, $8) returning id`,
  [co, o.title, o.kind ?? 'job', o.stipend ?? null, o.months ?? null, o.hours ?? null, o.questions ?? [], JSON.stringify(o.rubric ?? [])])
ok((await fails(mk(coA, { title: 'Unpaid internship', kind: 'internship', months: 6 }))) !== null, 'internships must show a stipend')
ok((await fails(mk(coA, { title: 'Internship, no length', kind: 'internship', stipend: 'KSh 20,000 a month' }))) !== null, 'internships must say how long they last')
const [intern] = await mk(coA, { title: 'Data internship', kind: 'internship', stipend: 'KSh 20,000 a month', months: 6 })
ok(Boolean(intern?.id), 'a paid internship with a length can be posted')
ok((await fails(mk(coA, { title: 'Volunteer at a company', kind: 'volunteer', months: 3, hours: 10 }))) !== null, 'companies that are not checked non-profits cannot post volunteer roles')
ok((await as(recA, () => fails(q(`update public.companies set is_nonprofit = true where id = $1`, [coA])))) !== null, 'a company cannot mark itself a non-profit')
await as(admin, () => q(`update public.companies set is_nonprofit = true where id = $1`, [coC]))
ok((await q(`select is_nonprofit from public.companies where id = $1`, [coC]))[0].is_nonprofit === true, 'the admin can mark an organisation a non-profit')
ok((await fails(mk(coC, { title: 'Volunteer, no hours', kind: 'volunteer', months: 3 }))) !== null, 'volunteer roles must say hours a week')
const [vol] = await mk(coC, { title: 'Community data volunteer', kind: 'volunteer', months: 3, hours: 8 })
ok(Boolean(vol?.id), 'a checked non-profit can post a volunteer role')
ok((await fails(mk(coA, { title: 'Bad guide', rubric: [{ name: 'Accuracy', weight: 60 }, { name: 'Style', weight: 30 }] }))) !== null, 'scoring guide weights must add up to 100')
ok((await fails(mk(coA, { title: 'Too many questions', questions: ['a?', 'b?', 'c?', 'd?'] }))) !== null, 'at most 3 screening questions')
const [screened] = await mk(coA, { title: 'Screened analyst task', questions: ['When can you start?', 'Are you based in Nairobi?'], rubric: [{ name: 'Accuracy', weight: 60 }, { name: 'Communication', weight: 40 }] })
const subWith = (gid, answers) => q(`insert into public.submissions (task_id, grad_id, summary, work_link, video_url, writeup, answers) values ($1,$2,'Screened summary here.','https://x.co/a','https://x.co/v',$3,$4) returning id`, [screened.id, gid, words(260), answers])
ok((await as(grad2, () => fails(subWith(grad2, [])))) !== null, 'graduates must answer the employer’s questions')
const [ssub] = await as(grad2, () => subWith(grad2, ['In January', 'Yes, Kasarani']))
ok(Boolean(ssub?.id), 'graduates can submit with answers')
ok((await as(grad2, () => q(`select public.my_answers($1) as a`, [screened.id])))[0].a[1] === 'Yes, Kasarani', 'graduates can read their own answers')
ok((await as(recC, () => fails(q(`select answers from public.submissions where id = $1`, [ssub.id])))) !== null, 'other companies cannot read answers directly')
ok((await as(recC, () => q(`select * from public.task_submissions($1)`, [screened.id]))).length === 0, 'other companies cannot see a task’s submissions')
ok((await as(recA, () => q(`select answers from public.task_submissions($1) where submission_id = $2`, [screened.id, ssub.id])))[0]?.answers[0] === 'In January', 'the posting company sees the answers')
ok((await as(recC, () => fails(q(`select public.score_submission($1, $2)`, [ssub.id, JSON.stringify({ Accuracy: 5, Communication: 3 })])))) !== null, 'other companies cannot score')
ok((await as(recA, () => fails(q(`select public.score_submission($1, $2)`, [ssub.id, JSON.stringify({ Accuracy: 5 })])))) !== null, 'every part of the guide needs a mark')
ok(Number((await as(recA, () => q(`select public.score_submission($1, $2) as s`, [ssub.id, JSON.stringify({ Accuracy: 5, Communication: 3 })])))[0].s) === 84, 'scores are weighted out of 100')
ok(Number((await as(recA, () => q(`select score from public.task_submissions($1) where submission_id = $2`, [screened.id, ssub.id])))[0].score) === 84, 'the company sees the score')
ok((await as(recC, () => q(`select * from public.scores`))).length === 0, 'other companies cannot see scores')
ok((await as(recC, () => fails(q(`select public.move_to_round2($1, 'Please present this to our credit committee.', '{}', 7)`, [ssub.id])))) !== null, 'other companies cannot move people to round 2')
ok((await as(recA, () => fails(q(`select public.move_to_round2($1, 'Please present this to our credit committee.', '{}', 30)`, [ssub.id])))) !== null, 'round 2 deadlines are 2 to 14 days')
const r2Mails = (await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n
const [r2] = await as(recA, () => q(`select public.move_to_round2($1, 'Please present this to our credit committee in 5 slides.', $2, 7) as id`, [ssub.id, ['What would you check next?']]))
const r2Mail = (await q(`select body from net.calls where url like '%resend%' order by ctid desc limit 1`))[0].body
ok(Boolean(r2?.id) && r2Mail.to[0] === 'brian@gmail.com' && r2Mail.subject.includes('round 2'), 'moving someone to round 2 emails them')
ok((await as(grad2, () => q(`select * from public.my_round2()`))).length === 1, 'the graduate sees their round 2')
ok((await as(recC, () => q(`select * from public.round2`))).length === 0, 'other companies cannot see round 2')
ok((await as(grad1, () => fails(q(`select public.respond_round2($1, 'https://youtu.be/x', null, null)`, [r2.id])))) !== null, 'only that graduate can answer')
await as(grad2, () => q(`select public.respond_round2($1, 'https://youtu.be/answer', 'https://drive.example/deck', 'Thanks for the chance.')`, [r2.id]))
const back = (await as(recA, () => q(`select round2 from public.task_submissions($1) where submission_id = $2`, [screened.id, ssub.id])))[0].round2
ok(back.status === 'submitted' && back.video_url === 'https://youtu.be/answer', 'the company sees the round 2 answer')
ok((await q(`select count(*)::int as n from net.calls where url like '%resend%'`))[0].n === r2Mails + 2, 'the recruiter is emailed when the answer arrives')
ok((await as(grad2, () => fails(q(`select public.respond_round2($1, 'https://youtu.be/again', null, null)`, [r2.id])))) !== null, 'round 2 can only be answered once')
const pj = await as('anon', () => q(`select kind, stipend, duration_months from public.public_jobs($1)`, [intern.id]))
ok(pj[0]?.kind === 'internship' && pj[0]?.stipend === 'KSh 20,000 a month', 'the job board shows the type and stipend')

// Impact numbers
const impact = (await as(admin, () => q(`select public.impact_stats() as s`)))[0].s
ok(impact.graduates >= 3 && impact.graduates_hired >= 1 && impact.monthly.length === 12, 'admins see the impact numbers')
ok(impact.graduates_invited >= impact.graduates_hired && impact.graduates_with_work >= impact.graduates_invited, 'the funnel adds up')
ok(!JSON.stringify(impact).includes('Wanjiru'), 'impact numbers never include names')
ok((await as(grad1, () => fails(q(`select public.impact_stats()`)))) !== null, 'graduates cannot see impact numbers')
ok((await as(recA, () => fails(q(`select public.impact_stats()`)))) !== null, 'recruiters cannot see impact numbers')
ok((await as('anon', () => fails(q(`select public.impact_stats()`)))) !== null, 'visitors cannot see impact numbers')

// Email design
const mails = (await q(`select body from net.calls where url like '%resend%'`)).map((r) => r.body.html)
ok(mails.length > 0 && mails.every((h) => h.includes('/brand/email-logo.png')), 'every email carries the logo')
ok((await q(`select count(*)::int as n from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prosrc like '%#0E5C45%'`))[0].n === 0, 'no email uses the old green')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
