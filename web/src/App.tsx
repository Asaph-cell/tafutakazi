import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RequireRole } from './components/RequireRole'
import Home from './pages/Home'

// Every page except the homepage loads on demand, so the first visit stays fast on a phone.
const GradSignup = lazy(() => import('./pages/GradSignup'))
const RecruiterSignup = lazy(() => import('./pages/RecruiterSignup'))
const Login = lazy(() => import('./pages/Login'))
const Support = lazy(() => import('./pages/Support'))
const About = lazy(() => import('./pages/About'))
const Jobs = lazy(() => import('./pages/Jobs'))
const JobPage = lazy(() => import('./pages/JobPage'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const CheckEmail = lazy(() => import('./pages/SmallPages').then((m) => ({ default: m.CheckEmail })))
const ResetPassword = lazy(() => import('./pages/SmallPages').then((m) => ({ default: m.ResetPassword })))
const NotFound = lazy(() => import('./pages/SmallPages').then((m) => ({ default: m.NotFound })))
const Terms = lazy(() => import('./pages/SmallPages').then((m) => ({ default: () => <m.Legal kind="terms" /> })))
const Privacy = lazy(() => import('./pages/SmallPages').then((m) => ({ default: () => <m.Legal kind="privacy" /> })))

const MyWork = lazy(() => import('./pages/grad/MyWork'))
const Profile = lazy(() => import('./pages/grad/Profile'))
const Tasks = lazy(() => import('./pages/grad/Tasks'))
const TaskPage = lazy(() => import('./pages/grad/TaskPage'))
const Submit = lazy(() => import('./pages/grad/Submit'))
const RequestTask = lazy(() => import('./pages/grad/RequestTask'))

const Browse = lazy(() => import('./pages/recruiter/Browse'))
const GradWorkPage = lazy(() => import('./pages/recruiter/GradWorkPage'))
const PostTask = lazy(() => import('./pages/recruiter/PostTask'))
const Candidates = lazy(() => import('./pages/recruiter/Candidates'))
const MyTasks = lazy(() => import('./pages/recruiter/MyTasks'))
const Account = lazy(() => import('./pages/recruiter/Account'))

const AdminTasks = lazy(() => import('./pages/admin/AdminTasks'))
const AdminTaskForm = lazy(() => import('./pages/admin/AdminTaskForm'))
const AdminReview = lazy(() => import('./pages/admin/AdminReview'))
const AdminSubmission = lazy(() => import('./pages/admin/AdminSubmission'))
const AdminRequests = lazy(() => import('./pages/admin/AdminRequests'))

export default function App() {
  return (
    <Suspense fallback={<div className="p-10 text-muted">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobPage />} />
        <Route path="/join" element={<GradSignup />} />
        <Route path="/hiring" element={<RecruiterSignup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/check-email" element={<CheckEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/support" element={<Support />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="/me" element={<RequireRole role="grad"><MyWork /></RequireRole>} />
        <Route path="/me/profile" element={<RequireRole role="grad"><Profile /></RequireRole>} />
        <Route path="/tasks" element={<RequireRole role="grad"><Tasks /></RequireRole>} />
        <Route path="/tasks/request" element={<RequireRole role="grad"><RequestTask /></RequireRole>} />
        <Route path="/tasks/:id" element={<RequireRole role="grad"><TaskPage /></RequireRole>} />
        <Route path="/tasks/:id/submit" element={<RequireRole role="grad"><Submit /></RequireRole>} />

        <Route path="/browse" element={<RequireRole role="recruiter"><Browse /></RequireRole>} />
        <Route path="/browse/:gradId" element={<RequireRole role="recruiter"><GradWorkPage /></RequireRole>} />
        <Route path="/post" element={<RequireRole role="recruiter"><PostTask /></RequireRole>} />
        <Route path="/candidates" element={<RequireRole role="recruiter"><Candidates /></RequireRole>} />
        <Route path="/my-tasks" element={<RequireRole role="recruiter"><MyTasks /></RequireRole>} />
        <Route path="/account" element={<RequireRole role="recruiter"><Account /></RequireRole>} />

        <Route path="/admin" element={<RequireRole role="admin"><AdminTasks /></RequireRole>} />
        <Route path="/admin/new" element={<RequireRole role="admin"><AdminTaskForm /></RequireRole>} />
        <Route path="/admin/tasks/:id" element={<RequireRole role="admin"><AdminTaskForm /></RequireRole>} />
        <Route path="/admin/requests" element={<RequireRole role="admin"><AdminRequests /></RequireRole>} />
        <Route path="/admin/review" element={<RequireRole role="admin"><AdminReview /></RequireRole>} />
        <Route path="/admin/review/:id" element={<RequireRole role="admin"><AdminSubmission /></RequireRole>} />

        {/* A graduate's public CV link: tafutakazi.co.ke/<their-name-xxxx>. Keep this last. */}
        <Route path="/:slug" element={<PublicProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
