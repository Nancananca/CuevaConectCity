// Native viewers track the environment after a user places the scene.
// Opening a QR URL does not transfer the QR's camera pose to either viewer.
export const PUBLIC_BASE='https://nancananca.github.io/CuevaConectCity/';
export const SURFACE_RELEASE='3.0-surface';
export function deviceRoute({userAgent='',platform='',maxTouchPoints=0,quickLook=false}={}){
  if(/android/i.test(userAgent))return 'android';
  const appleMobile=/iPhone|iPad|iPod/i.test(userAgent)||(/Mac/i.test(platform)&&maxTouchPoints>1);
  if(appleMobile)return quickLook?'quick-look':'apple-browser';
  return 'desktop';
}
export function nativeLinks({baseUrl=PUBLIC_BASE,family='J2',lang='es'}={}){
  const base=new URL(baseUrl);
  if(base.protocol!=='https:'||base.username||base.password)throw new Error('Native AR needs a public HTTPS asset URL');
  base.search='';base.hash='';if(!base.pathname.endsWith('/'))base.pathname+='/';
  const safeFamily=['J1','J2','J4','J6'].includes(family)?family:'J2';
  const language=['es','en','ca'].includes(lang)?lang:'es';
  const model=new URL(`assets/models/m14-${safeFamily.toLowerCase()}.glb`,base);
  model.searchParams.set('v',SURFACE_RELEASE);
  const fallback=new URL('experiencia.html',base);
  fallback.search=new URLSearchParams({view:'3d',ar:'unavailable',lang:language}).toString();
  const passport=new URL('pasaporte.html',base);passport.searchParams.set('lang',language);
  const quickLook=new URL(`assets/models/m14-${safeFamily.toLowerCase()}.usdz`,base);
  quickLook.searchParams.set('v',SURFACE_RELEASE);
  quickLook.hash=new URLSearchParams({allowsContentScaling:'0',canonicalWebPageURL:passport.href}).toString();
  const query=new URLSearchParams({file:model.href,mode:'ar_preferred',title:`M-14 / ${safeFamily}`,resizable:'false',link:passport.href});
  const androidIntent=`intent://arvr.google.com/scene-viewer/1.0?${query}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(fallback.href)};end;`;
  return{family:safeFamily,quickLook:quickLook.href,androidIntent,modelUrl:model.href,fallback:fallback.href,passport:passport.href};
}
