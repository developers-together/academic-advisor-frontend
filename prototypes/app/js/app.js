/* Advisor full replica — boot + auth. Load this file LAST. */

const Auth = {
  view() {
    return `
    <div style="min-height:100vh; display:flex; flex-direction:column; align-items:center; background:#f8fafc;">
      <div class="row between" style="width:100%; padding:12px 16px;">
        <span></span>
        <span class="chip neutral">EN · العربية</span>
      </div>
      <div class="col gap-3" style="align-items:center; margin-top:8vh; width:100%;">
        <div class="row gap-2"><span class="brand-mark" style="width:36px;height:36px;border-radius:50%;background:var(--crimson-700);color:#fff;display:grid;place-items:center;font-weight:700;">A</span>
        <span style="font-size:18px; font-weight:600;">Advisor</span></div>
        <div class="card col gap-3" style="width:400px; padding:28px;" id="auth-card">
          <h1 style="font-size:20px;">Sign in</h1>
          <div>
            <label class="label">University email</label>
            <input class="input" id="auth-email" type="email" placeholder="name@ejust.edu.eg" value="student@ejust.edu.eg" />
          </div>
          <div>
            <label class="label">Password</label>
            <div class="row" style="position:relative;">
              <input class="input" id="auth-pass" type="password" value="password123" style="padding-inline-end:44px;" />
              <button class="icon-btn" style="position:absolute; inset-inline-end:2px; top:1px;" onclick="const p=document.getElementById('auth-pass'); p.type = p.type==='password' ? 'text' : 'password';">◉</button>
            </div>
            <p class="hint">Demo accounts: student / advisor / dean / vp / admin @ejust.edu.eg · password123</p>
          </div>
          <div id="auth-error"></div>
          <button class="btn primary" style="width:100%;" onclick="Auth.submit()">Sign in</button>
          <div class="row between sm">
            <a href="#" onclick="Auth.pane('forgot'); return false;">Forgot password?</a>
            <a href="#" onclick="Auth.pane('signup'); return false;">Create an account</a>
          </div>
        </div>
        <div id="auth-alt"></div>
        <p class="xs muted">Prototype · data resets on refresh · not the real product</p>
      </div>
    </div>`;
  },

  pane(kind) {
    const alt = document.getElementById('auth-alt');
    if (kind === 'forgot') {
      alt.innerHTML = `<div class="card col gap-2" style="width:400px; padding:20px; margin-top:12px;">
        <h3>Reset your password</h3>
        <p class="sm muted">We send a reset link to your university email. The link expires in 30 minutes.</p>
        <button class="btn outline sm" onclick="Store.toast('Reset link sent (simulated). Check your inbox.'); this.closest('.card').remove()">Send reset link</button>
        <a href="#" onclick="this.closest('.card').remove(); return false;" class="sm">← Back to sign in</a>
      </div>`;
    }
    if (kind === 'signup') {
      alt.innerHTML = `<div class="card col gap-2" style="width:400px; padding:20px; margin-top:12px;">
        <h3>Create your account</h3>
        <p class="sm muted">Sign-up binds to your SIS record: enter your student ID, then the credentials your university issued.</p>
        <button class="btn outline sm" onclick="Store.toast('Binding flow ships with implementation.', 'info')">Continue</button>
        <a href="#" onclick="this.closest('.card').remove(); return false;" class="sm">← Back to sign in</a>
      </div>`;
    }
  },

  submit() {
    const email = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    if (!Store.login(email, pass)) {
      document.getElementById('auth-error').innerHTML =
        UI.banner('destructive', 'That email or password is wrong.', 'Nothing was sent. Try again or reset your password.');
      return;
    }
    const me = Store.me();
    location.hash = HOME[me.role] === '#/app' ? '#/app' : HOME[me.role];
    App.render();
  },

  after() {},
};

Auth.uiRequestMeeting = function () {
  const reason = document.getElementById('mtg-reason').value;
  const note = document.getElementById('mtg-note').value;
  const slot = document.querySelector('input[name="slot"]:checked');
  Store.requestMeeting(reason, note, slot ? slot.value : null);
  document.getElementById('req-mtg').style.display = 'none';
  Store.toast('Request sent to your advisor.');
};
Store.onChange(() => {
  if (Store.me()) App.render();
  else { document.getElementById('root').innerHTML = Auth.view(); Auth.after(); }
});
App.render();
