const ROSE = '#D37B97'
const GREEN = '#457558'
const TEXT = '#273138'
const MUTED = '#6b7280'
const BORDER = '#e5e7eb'

const base = (content: string) => `
<div style="background:#f8fafc;padding:24px;font-family:Arial,Helvetica,sans-serif;color:${TEXT}">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;overflow:hidden">
    <div style="padding:20px 24px;background:linear-gradient(120deg, ${GREEN}, ${ROSE});">
      <h1 style="margin:0;font-size:22px;color:#ffffff;letter-spacing:0.2px">Maternix Track</h1>
      <p style="margin:6px 0 0 0;font-size:13px;color:#f5f5f5">Clinical education updates</p>
    </div>
    <div style="padding:24px">${content}</div>
  </div>
  <p style="max-width:620px;margin:10px auto 0 auto;font-size:12px;color:${MUTED};text-align:center">
    Maternix Track - Clinical Education Platform
  </p>
</div>`

export const signupPendingAdminEmail = (d: {
  userName: string
  userEmail: string
  role: string
  requestedDate: string
}) => base(`
  <h2 style="color:${GREEN};margin:0 0 10px 0">New Registration Request</h2>
  <p style="margin:0 0 8px 0">
    <strong>${d.userName}</strong> (${d.userEmail}) requested access as
    <strong>${d.role === 'instructor' ? 'Clinical Instructor' : 'Nursing Student'}</strong>.
  </p>
  <p style="margin:0 0 16px 0;color:${MUTED}">Requested: ${d.requestedDate}</p>
  <div style="padding:12px 14px;border:1px solid ${BORDER};border-radius:10px;background:#fbfbfb">
    Approve or reject this request from the Admin Dashboard.
  </div>
`)

export const accountApprovedEmail = (d: {
  userName: string
  verifyUrl: string
  roleLabel: string
}) => base(`
  <h2 style="color:${GREEN};margin:0 0 12px 0">Account Approved</h2>
  <p style="margin:0 0 10px 0">Hi <strong>${d.userName}</strong>,</p>
  <p style="margin:0 0 10px 0">
    Your Maternix Track account for <strong>${d.roleLabel}</strong> has been approved.
    Verify your email to activate your access.
  </p>
  <a href="${d.verifyUrl}"
    style="display:inline-block;background:${ROSE};color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;margin:6px 0 10px 0">
    Verify and Activate Account
  </a>
  <p style="margin:0;color:${MUTED};font-size:12px">
    If the button does not work, copy this link:
    <br />
    <a href="${d.verifyUrl}" style="color:${GREEN};word-break:break-all">${d.verifyUrl}</a>
  </p>
`)

export const accountRejectedEmail = (d: { userName: string; reason?: string }) => base(`
  <h2 style="color:#d4183d;margin:0 0 12px 0">Account Not Approved</h2>
  <p style="margin:0 0 10px 0">Hi <strong>${d.userName}</strong>,</p>
  <p style="margin:0 0 10px 0">
    Your registration request was not approved.
    ${d.reason ? `Reason: ${d.reason}` : ''}
  </p>
  <p style="margin:0;color:${MUTED}">Please contact your institution for assistance.</p>
`)

export const announcementEmail = (d: {
  title: string
  content: string
  category: string
  instructorName: string
}) => base(`
  <h2 style="color:${GREEN};margin:0 0 12px 0">${d.title}</h2>
  <span style="background:#fde8ef;color:${ROSE};padding:4px 10px;border-radius:999px;font-size:12px">${d.category}</span>
  <p style="margin:16px 0 0 0">${d.content}</p>
  <p style="color:${MUTED};font-size:13px;margin:20px 0 0 0">Posted by ${d.instructorName}</p>
`)
