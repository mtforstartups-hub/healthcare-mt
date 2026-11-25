const messages:Record<string,string>={
 config:'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the hosting environment.',
 denied:'Sign-in was cancelled. Try again when you are ready.',
 state:'That sign-in attempt expired. Please start again.',
 domain:'Only @marketingtusk.com Google accounts can sign in.',
 failed:'Sign-in could not be completed. Please try again.'
};

export async function AdminLogin({returnTo,error}:{returnTo?:string;error?:string}={}){
 const href='/api/auth/google/start'+(returnTo?'?returnTo='+encodeURIComponent(returnTo):'');
 return <main id="main"><section className="section utility-section"><div className="container narrow">
  <span className="eyebrow">Marketing Tusk Healthcare</span>
  <h1>Website admin</h1>
  <p>Sign in with your Marketing Tusk Google account to manage enquiries and content.</p>
  {error&&<p className="form-error" role="alert">{messages[error]??messages.failed}</p>}
  <p><a className="button primary" href={href}>Continue with Google</a></p>
  <p className="field-hint">Access is limited to @marketingtusk.com accounts. Individual Gmail accounts cannot sign in.</p>
 </div></section></main>;
}
