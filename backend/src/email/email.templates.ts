const PINK = '#D37B97'
const GREEN = '#457558'

const base = (content: string) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <div style="background:${PINK};padding:16px 24px;border-radius:8px 8px 0 0">
    <h1 style="color:#fff;margin:0;font-size:20px">Maternix Track</h1>
  </div>
  <div style="background:#fff;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">
    ${content}
  </div>
  <p style="color:#999;font-size:12px;text-align:center;margin-top:16px">
    © Maternix Track - Clinical Education Platform
  </p>
</div>`

export const signupPendingAdminEmail = (d: {
  userName: string
  userEmail: string
  role: string
  requestedDate: string
}) => base(`
  <h2 style="color:${GREEN}">New Registration Request</h2>
  <p><strong>${d.userName}</strong> (${d.userEmail}) has requested access as a <strong>${d.role}</strong>.</p>
  <p>Requested: ${d.requestedDate}</p>
  <p>Log in to the admin dashboard to approve or reject this request.</p>
`)

export const accountApprovedEmail = (d: { userName: string; appUrl: string }) => base(`
  <h2 style="color:${GREEN}">Account Approved!</h2>
  <p>Hi <strong>${d.userName}</strong>,</p>
  <p>Your Maternix Track account has been approved. You may now log in and begin your clinical journey.</p>
  <a href="${d.appUrl}/login"
     style="display:inline-block;background:${PINK};color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;margin-top:12px">
    Log In Now
  </a>
`)

export const accountRejectedEmail = (d: { userName: string; reason?: string }) => base(`
  <h2 style="color:#d4183d">Account Not Approved</h2>
  <p>Hi <strong>${d.userName}</strong>,</p>
  <p>Unfortunately your registration request was not approved.${d.reason ? ` Reason: ${d.reason}` : ''}</p>
  <p>Please contact your institution for further assistance.</p>
`)

export const announcementEmail = (d: {
  title: string
  content: string
  category: string
  instructorName: string
}) => base(`
  <h2 style="color:${GREEN}">${d.title}</h2>
  <span style="background:${PINK}20;color:${PINK};padding:2px 10px;border-radius:999px;font-size:12px">${d.category}</span>
  <p style="margin-top:16px">${d.content}</p>
  <p style="color:#999;font-size:13px;margin-top:24px">Posted by ${d.instructorName}</p>
`)
