import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '../components/PublicHeader'
import { Seo } from '../components/Seo'
import { SiteFooter } from '../components/SiteFooter'

const EMAIL = 'hello@tafutakazi.co.ke'
const UPDATED = '14 October 2026'

const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>

function H2({ children }: { children: ReactNode }) {
  return <h2 className="m-0 mt-6 text-[21px] font-semibold tracking-[-0.02em] text-ink">{children}</h2>
}
function Ol({ children }: { children: ReactNode }) {
  return <ol className="m-0 flex flex-col gap-2 pl-6">{children}</ol>
}
function Ul({ children }: { children: ReactNode }) {
  return <ul className="m-0 flex flex-col gap-2 pl-6">{children}</ul>
}

function Shell({ title, other, children }: { title: string; other: { to: string; label: string }; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Seo title={title} />
      <PublicHeader />
      <main className="mx-auto max-w-[1280px] px-5 pb-6 pt-4 sm:px-6 sm:pt-10">
        <article className="flex max-w-[70ch] flex-col gap-4 text-[17px] leading-relaxed text-ink-2">
          <h1 className="m-0 text-[34px] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-[42px]">{title}</h1>
          <span className="text-sm text-muted">Last updated {UPDATED} · <Link to={other.to}>{other.label}</Link></span>
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}

export function Terms() {
  return (
    <Shell title="Terms of Use" other={{ to: '/privacy', label: 'Privacy Policy' }}>
      <H2>1. About Tafutakazi</H2>
      <p className="m-0">
        Tafutakazi (tafutakazi.co.ke) is an independent project, not a registered company. In these Terms, "Tafutakazi",
        "we" and "us" mean the people who run it, reachable at <Mail />. It lets fresh graduates show practical work and
        lets recruiters judge that work. By creating an account you agree to these Terms and the{' '}
        <Link to="/privacy">Privacy Policy</Link>. If you don't agree, don't use the site.
      </p>

      <H2>2. Accounts</H2>
      <Ol>
        <li>You must be at least 18 and give true information: your real name, course, company and job title.</li>
        <li>Every account needs a working email address that you confirm. It is how we reach you.</li>
        <li>One person, one account. You may not share your login or let anyone else use your account.</li>
        <li>You are responsible for everything done through your account. Tell us at <Mail /> straight away if you think someone else has used it.</li>
        <li>
          Recruiter accounts represent a real company. Before posting tasks, a recruiter must show the company is real
          with a company email address, or a link to the company's website, LinkedIn page, or business page on Facebook,
          Instagram or TikTok.
        </li>
      </Ol>

      <H2>3. Graduates' work belongs to graduates</H2>
      <Ol>
        <li>Work you submit stays yours. Tafutakazi does not own it, and nor does any recruiter.</li>
        <li>You give Tafutakazi a limited licence to store your work and show it to signed-in recruiters, only to run the site.</li>
        <li>
          You must only submit work you did yourself. Copying another person's work, or submitting work done by someone
          else or by a tool you don't disclose, gets your account removed.
        </li>
        <li>
          Tasks and their sample data belong to Tafutakazi or the company that posted them. Use them only to do the
          task. Your work on a task stays on your profile after the task closes, and any recruiter can see it. Other
          recruiters see the task as coming from a company in that industry (for example "a logistics company"), never
          the company's name.
        </li>
        <li>
          You can delete any work you submitted, from its edit page. Its preview, verdict, comments, thumbs up and any
          interview invite are deleted with it. Deleting your account deletes all your work.
        </li>
        <li>Links you add under "Other work" on your profile are your responsibility. Only link to things you made or worked on, and nothing private.</li>
      </Ol>

      <H2>4. What recruiters agree to</H2>
      <Ol>
        <li>You use Tafutakazi only to find and assess people for real jobs at your company.</li>
        <li>Previews, videos, write-ups and full-work links are shown to you to assess the graduate. They are not given to you to use in your business.</li>
        <li>
          A full-work link unlocks when you invite a graduate to interview. Unlocking it does not give you any right to
          use the work. You may use a graduate's work only with their written permission, for example after hiring them
          or paying for it.
        </li>
        <li>
          When you invite a graduate, contact them, and keep the invite's status up to date. Graduates see how many of
          the people a company invites it actually contacts. If 3 graduates report that a company invited them and
          never got in touch, the company is paused until we've looked into it.
        </li>
        <li>Comments must be honest and respectful. No harassment, discrimination, or requests for payment from graduates.</li>
      </Ol>

      <H2>5. Keep what you see confidential</H2>
      <p className="m-0">
        Everything behind the sign-in is confidential: graduates' work, videos, write-ups, verdicts, comments, tasks,
        sample data and other users' personal details. You may view it on Tafutakazi for the purpose it was shown to
        you. You may not take it off the site.
      </p>

      <H2>6. Leaks: you are responsible for what you share</H2>
      <p className="m-0">
        A leak is any copying, downloading, screenshotting, recording, forwarding, posting or selling of confidential
        material outside Tafutakazi, by any means, without the owner's written permission. This includes:
      </p>
      <Ul>
        <li>a recruiter using or passing on a graduate's work or details</li>
        <li>a graduate sharing another graduate's work, or their own answers to a task so others can copy them</li>
        <li>anyone scraping the site, sharing their login, or publishing tasks or sample data</li>
      </Ul>
      <p className="m-0">If you leak, <strong className="text-ink">you alone are responsible</strong> for the consequences, not Tafutakazi. Specifically:</p>
      <Ol>
        <li>
          <strong className="text-ink">We can trace it.</strong> Every preview carries the graduate's name, and shows
          the viewer's email and the date while it is viewed. We log who opened what and when. We will use these
          records to identify the source of a leak.
        </li>
        <li>
          <strong className="text-ink">Your account ends.</strong> We suspend or delete the account immediately. For
          recruiters, we may tell graduates which company's account was removed and why.
        </li>
        <li>
          <strong className="text-ink">You pay for the damage.</strong> You agree to compensate (indemnify) Tafutakazi
          and any graduate or recruiter harmed, including their reasonable legal costs.
        </li>
        <li>
          <strong className="text-ink">We may take legal action</strong> and share evidence with the affected person,
          the police or the Office of the Data Protection Commissioner (ODPC). Depending on what was leaked, this may
          fall under the Copyright Act 2001, the Data Protection Act 2019 and the Computer Misuse and Cybercrimes Act 2018.
        </li>
      </Ol>
      <p className="m-0">
        We protect the site with sign-in, marked previews with no download button, hidden full-work links and access
        logs. No website can stop someone photographing a screen, which is why responsibility rests with the person who
        leaks.
      </p>

      <H2>7. Other things you must not do</H2>
      <Ul>
        <li>Create fake accounts, fake companies or fake reviews</li>
        <li>Try to get around the task limits, the lock on full work, or the site's security</li>
        <li>Contact graduates to ask them for money, or offer "jobs" that require payment</li>
        <li>Upload viruses, or anything illegal, hateful or sexual</li>
      </Ul>

      <H2>8. Rules for tasks</H2>
      <Ol>
        <li>A task is a short sample of the real job, doable in 4 hours or less.</li>
        <li>It must use sample, old or made-up data. No real customer or staff personal data, and no live client work.</li>
        <li>
          It may not ask graduates to sell for the company, post on its real accounts, pay anything, share ID or M-Pesa
          details, or contact the company off the site.
        </li>
        <li>
          Every company task is checked before it goes live. An automatic check reads it first; anything it isn't sure
          about is checked by a person. A task that isn't approved is turned off, and the recruiter is emailed the
          reason and can post a corrected one.
        </li>
        <li>Graduates can report a task. A task reported by 3 graduates is paused automatically.</li>
        <li>
          Each task is tied to a real role. Graduates do it to show what they can do, and the company invites the people
          it wants to interview. Doing a task is not a job application and doesn't guarantee an interview. The recruiter
          can turn a task off at any time, for example once they've hired. A salary range is optional. Asking graduates
          for money of any kind gets the company removed.
        </li>
        <li>A company's record (how much of the work it receives gets feedback, and how many invited graduates it contacts) is shown to graduates.</li>
      </Ol>

      <H2>9. Free to use, open tasks and support</H2>
      <Ol>
        <li>Tafutakazi is free for graduates and recruiters. There are no paid plans. Graduates never pay.</li>
        <li>
          A company can have up to 4 open tasks. A company that gives feedback on at least 80% of the work it receives
          unlocks 3 more, up to 7 open at once. The limit is per company, however many recruiter accounts it has. Tasks
          that are off don't count.
        </li>
        <li>
          Anyone may <Link to="/support">support Tafutakazi</Link> with a voluntary contribution ("buy us a chai"). It is
          a gift: it buys no extra features, changes nothing on your account and is not refundable.
        </li>
        <li>
          Companies, universities, colleges and NGOs can partner with Tafutakazi by agreement. A partnership never gives
          a partner access to graduates' work beyond what these Terms allow any recruiter.
        </li>
      </Ol>

      <H2>10. What Tafutakazi is and isn't responsible for</H2>
      <Ol>
        <li>Tafutakazi is a place to show and view work. We are not an employment agency and don't promise anyone a job, an interview or a hire.</li>
        <li>Recruiters and graduates deal with each other directly. We are not part of any job offer, contract or payment between them.</li>
        <li>We check tasks and act on reports, but we don't check every piece of work, every link or every comment by hand.</li>
        <li>The site is provided as it is. We work to keep it running and secure but can't promise it will never be down or error-free.</li>
        <li>To the extent Kenyan law allows, we are not liable for indirect losses.</li>
        <li>Nothing in these Terms limits liability that the law does not allow us to limit.</li>
      </Ol>

      <H2>11. Ending your account</H2>
      <p className="m-0">
        You can delete your account at any time from your profile. We may suspend or close an account that breaks these
        Terms, with or without notice depending on how serious the breach is. Sections 5, 6 and 10 continue to apply
        after an account ends.
      </p>

      <H2>12. Changes</H2>
      <p className="m-0">
        We may update these Terms. We'll email you about important changes at least 14 days before they apply.
        Continuing to use the site after that means you accept them.
      </p>

      <H2>13. Law and disputes</H2>
      <p className="m-0">
        These Terms are governed by the laws of Kenya. We'll first try to settle any dispute by talking. If that fails,
        it goes to the courts of Kenya. Questions: <Mail />.
      </p>
    </Shell>
  )
}

export function Privacy() {
  const rows: [string, string, string][] = [
    ['Name, email, password (stored encrypted), course, university, year, the job you want', 'Graduates', 'Your account, your profile, showing you tasks for your field'],
    ['Work previews, full-work links, video links, write-ups, tools used, "Other work" links', 'Graduates', 'Showing your work to recruiters'],
    ['Name, job title, work email, company, website, LinkedIn or business social media page, roles hired for', 'Recruiters', 'Your account, and showing graduates your company is real'],
    ['Tasks posted', 'Recruiters', 'Showing them to graduates, and checking them before they go live'],
    ['Thumbs up, comments, invites and their status, views', 'Recruiters and graduates', 'Feedback for graduates, and each company\'s record'],
    ['Who opened which work and when', 'Everyone signed in', 'Security, tracing leaks, fixing problems'],
  ]
  return (
    <Shell title="Privacy Policy" other={{ to: '/terms', label: 'Terms of Use' }}>
      <p className="m-0">
        We collect only what Tafutakazi needs to show graduates' work to recruiters, and we never sell personal data.
        This policy follows Kenya's Data Protection Act 2019. The people who run Tafutakazi are the data controller,
        reachable at <Mail />.
      </p>

      <H2>What we collect and why</H2>
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[560px] border-collapse text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-ink">
              <th className="p-3 font-semibold">Data</th>
              <th className="p-3 font-semibold">From whom</th>
              <th className="p-3 font-semibold">Why</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([d, w, y]) => (
              <tr key={d} className="border-b border-[#EEEEE9] align-top last:border-0">
                <td className="p-3">{d}</td>
                <td className="p-3">{w}</td>
                <td className="p-3">{y}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="m-0">We don't collect ID numbers, KRA PINs, M-Pesa details or anything we don't need.</p>

      <H2>Who can see it</H2>
      <Ul>
        <li><strong className="text-ink">Your work and profile:</strong> only signed-in recruiters. Other graduates cannot see it.</li>
        <li>
          <strong className="text-ink">Your public link</strong> (for example tafutakazi.co.ke/your-name) shows only your
          name, course, task titles, a one-line summary of each task, verdicts and counts of thumbs up and invites; never
          your videos, work or write-ups.
        </li>
        <li><strong className="text-ink">Full-work links and your email address:</strong> only recruiters who invited you to interview.</li>
        <li><strong className="text-ink">Recruiters' company name, website, LinkedIn or business social media page, and record:</strong> graduates.</li>
        <li><strong className="text-ink">Comments:</strong> the graduate they're about, with the recruiter's name and company.</li>
        <li><strong className="text-ink">Leak evidence:</strong> the affected person, the police or the ODPC, if we need to act on a leak.</li>
      </Ul>

      <H2>Services that process data for us</H2>
      <Ul>
        <li><strong className="text-ink">Supabase:</strong> accounts, the database and uploaded previews.</li>
        <li><strong className="text-ink">Cloudflare:</strong> hosting the site, our domain and email forwarding, and visitor statistics that use no cookies.</li>
        <li><strong className="text-ink">Resend:</strong> sending our emails.</li>
        <li>
          <strong className="text-ink">Google Gemini:</strong> the automatic check reads the text of tasks companies post
          (the company name, role and instructions) before they go live. Nothing about graduates is ever sent to it. We
          use Google's free service, under which Google may use that task text to improve its products.
        </li>
        <li><strong className="text-ink">Safaricom M-Pesa:</strong> only if you choose to send a chai, under Safaricom's own policy.</li>
      </Ul>
      <p className="m-0">
        Each handles data only to provide its service. Some store data outside Kenya, under the safeguards the Data
        Protection Act requires. Videos and full work stay where you put them (YouTube, Loom, Google Drive and so on),
        under those services' own policies.
      </p>

      <H2>Previews</H2>
      <p className="m-0">
        When you upload a preview, your browser marks it with "tafutakazi.co.ke", your name and the word "preview"
        before it is sent to us, and removes hidden details such as where a photo was taken. Recruiters also see their
        own email and the date over it while viewing.
      </p>

      <H2>Emails</H2>
      <Ul>
        <li>
          <strong className="text-ink">Daily digest:</strong> at most one email a day, only when there's something new:
          new tasks for your field and counts of comments and thumbs up for graduates; new work in the roles they hire for
          for recruiters. Digests never include anyone's work, comment text, surname or contact details. Turn it off from
          your profile or account page; every digest links there.
        </li>
        <li>
          <strong className="text-ink">Emails about something you did or that involves you</strong> are always sent:
          confirming your email, resetting your password, interview invites and updates, reminders to companies about
          graduates they invited, and whether a task you posted was approved.
        </li>
      </Ul>

      <H2>How long we keep it</H2>
      <Ul>
        <li>Account and work: while your account is open, or until you delete that piece of work.</li>
        <li>After you delete your account: removed straight away from the site and within 30 days from backups, except records of a leak under investigation.</li>
        <li>Access logs: 12 months.</li>
      </Ul>

      <H2>Your rights</H2>
      <p className="m-0">
        You can ask to see, correct, download or delete your data, or object to how we use it. Most of this you can do
        from your profile; for the rest, email <Mail /> and we'll respond within 30 days. You can also complain to the
        Office of the Data Protection Commissioner (<a href="https://www.odpc.go.ke" rel="noopener noreferrer">odpc.go.ke</a>).
      </p>

      <H2>Security</H2>
      <p className="m-0">
        Passwords are encrypted, the site uses HTTPS, previews are marked and have no download button, and full-work links
        stay hidden until an invite. If a breach puts your data at risk, we'll tell you and the ODPC within 72 hours of
        finding out.
      </p>

      <H2>Contact</H2>
      <p className="m-0">Privacy questions: <Mail />. We'll email you before any important change to this policy.</p>
    </Shell>
  )
}
