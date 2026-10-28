// Which piece a scanned QR belongs to. Our codes are the site root (M-14) or the root with ?p=<ID>.
export function idFromQr(text){
 try{const u=new URL(text);if(!/^\/CuevaConectCity\/?(index\.html)?$/i.test(u.pathname))return null;
  const p=(u.searchParams.get('p')||'M-14').toUpperCase();return/^(M-\d{2}|SACA)$/.test(p)?p:null}catch{return null}
}
