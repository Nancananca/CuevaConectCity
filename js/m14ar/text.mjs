// Public texts of the M-14 experience (ES / EN / CA). Data figures come from data/m14.json.
export const LANGS=['es','en','ca'];
export function pickLang(){
 const q=new URLSearchParams(location.search).get('lang');if(LANGS.includes(q))return q;
 try{const s=localStorage.getItem('m14-lang');if(LANGS.includes(s))return s}catch{}
 const n=(navigator.language||'es').slice(0,2);return n==='ca'?'ca':n==='en'?'en':'es';
}
export const T={
 entryKicker:['PASAPORTE VIVO · M–14 / J2','LIVING PASSPORT · M–14 / J2','PASSAPORT VIU · M–14 / J2'],
 entryTitle:['Despierta<br><em>la pieza.</em>','Wake<br><em>the piece.</em>','Desperta<br><em>la peça.</em>'],
 entryLead:['Apunta al QR de la maqueta. Su historia aparece encima, fijada a la pieza, y puedes moverte a su alrededor.','Point at the QR on the model. Its story appears on top, fixed to the piece, and you can walk around it.','Apunta al QR de la maqueta. La seva història apareix a sobre, fixada a la peça, i pots moure’t al seu voltant.'],
 start:['Activar cámara','Start camera','Activar càmera'],
 startDesktop:['Ver la experiencia en 3D','View the experience in 3D','Veure l’experiència en 3D'],
 loading:['Cargando…','Loading…','Carregant…'],
 passport:['Pasaporte','Passport','Passaport'],
 view3d:['Ver en 3D sin cámara','View in 3D without camera','Veure en 3D sense càmera'],
 privacy:['La imagen se procesa en tu móvil. No se envía vídeo a ningún servidor.','Images are processed on your phone. No video is sent to any server.','La imatge es processa al teu mòbil. No s’envia vídeo a cap servidor.'],
 desktopNote:['La realidad aumentada funciona en el móvil: escanea el QR de la pieza. Aquí puedes ver la misma historia en 3D.','Augmented reality runs on phones: scan the QR on the piece. Here you can watch the same story in 3D.','La realitat augmentada funciona al mòbil: escaneja el QR de la peça. Aquí pots veure la mateixa història en 3D.'],
 // AR states
 find:['Apunta al QR','Point at the QR','Apunta al QR'],
 findHint:['Acércate a un palmo del QR, con buena luz.','Move about a hand-span from the QR, in good light.','Apropa’t a un pam del QR, amb bona llum.'],
 fixing:['Fijando la escena…','Fixing the scene…','Fixant l’escena…'],
 moveHint:['Mueve el móvil un poco de lado a lado.','Move the phone gently from side to side.','Mou el mòbil una mica d’un costat a l’altre.'],
 locked:['Anclada · muévete alrededor','Anchored · walk around','Ancorada · mou-te al voltant'],
 recovering:['Recuperando el entorno…','Recovering tracking…','Recuperant l’entorn…'],
 recoverHint:['Vuelve a mirar la maqueta y muévete despacio.','Look back at the model and move slowly.','Torna a mirar la maqueta i mou-te a poc a poc.'],
 moved:['Pieza movida · escena recolocada','Piece moved · scene re-anchored','Peça moguda · escena recol·locada'],
 reanchor:['Volver a fijar','Re-anchor','Tornar a fixar'],
 stepBack:['Aleja un poco el móvil para ver toda la escena.','Move the phone back a little to see the whole scene.','Allunya una mica el mòbil per veure tota l’escena.'],
 sound:['Sonido','Sound','So'],
 close:['Cerrar','Close','Tancar'],
 pause:['Pausa','Pause','Pausa'],
 play:['Seguir','Play','Continuar'],
 cameraError:['No se ha podido abrir la cámara. Revisa el permiso del navegador y vuelve a intentarlo.','The camera could not start. Check the browser permission and try again.','No s’ha pogut obrir la càmera. Revisa el permís del navegador i torna-ho a provar.'],
 motionError:['Hace falta permitir el movimiento del móvil para fijar la escena.','Motion access is needed to fix the scene in place.','Cal permetre el moviment del mòbil per fixar l’escena.'],
 engineError:['No se ha podido cargar la AR. Revisa la conexión o mira la experiencia en 3D.','AR could not load. Check your connection or watch the experience in 3D.','No s’ha pogut carregar l’AR. Revisa la connexió o mira l’experiència en 3D.'],
 incompatible:['Este navegador no permite la AR web. Abre el enlace en Safari (iPhone) o Chrome (Android), o mírala en 3D.','This browser does not support web AR. Open the link in Safari (iPhone) or Chrome (Android), or watch it in 3D.','Aquest navegador no permet l’AR web. Obre l’enllaç a Safari (iPhone) o Chrome (Android), o mira-la en 3D.'],
 footnote:['Escena ilustrativa · lecturas de la maqueta del 16/10/2026','Illustrative scene · scale-model readings of 16/10/2026','Escena il·lustrativa · lectures de la maqueta del 16/10/2026'],
 tapHint:['Toca las capas para saber más','Tap the layers to learn more','Toca les capes per saber-ne més'],
 // chapters
 ch:[
  {kick:['01 · ORIGEN','01 · ORIGIN','01 · ORIGEN'],title:['Una lona deja de ser residuo.','A tarp stops being waste.','Una lona deixa de ser residu.'],text:['Lonas de las fundas de barco del refit del Port Vell. PLASTICPeople las transforma en escama y después en plancha.','Tarps from boat covers in Port Vell refit. PLASTICPeople turns them into flakes, then into a board.','Lones de les fundes de vaixell del refit del Port Vell. PLASTICPeople les transforma en escama i després en planxa.']},
  {kick:['02 · MATERIA','02 · MATERIAL','02 · MATÈRIA'],title:['Dos capas. Una identidad.','Two layers. One identity.','Dues capes. Una identitat.'],text:['20 mm de PE reciclado y 80 mm de hormigón en el formato de proyecto de 3 × 1,5 m.','20 mm of recycled PE and 80 mm of concrete in the 3 × 1.5 m project format.','20 mm de PE reciclat i 80 mm de formigó en el format de projecte de 3 × 1,5 m.']},
  {kick:['03 · IDENTIDAD','03 · IDENTITY','03 · IDENTITAT'],title:['La pieza recuerda cada paso.','The piece remembers every step.','La peça recorda cada pas.'],text:['Su pasaporte guarda las lecturas registradas en la prueba de campo, de la plancha al retorno.','Its passport keeps the readings recorded in the field test, from board to return.','El seu passaport guarda les lectures registrades a la prova de camp, de la planxa al retorn.']},
  {kick:['04 · USO Y REÚSO','04 · USE & REUSE','04 · ÚS I REÚS'],title:['Cambia de lugar. Sigue siendo M-14.','A different place. Still M-14.','Canvia de lloc. Continua sent M-14.'],text:['En servicio en la posición P-14 de la plaza. Se desmonta, pasa a stock y vuelve a colocarse en Q-01.','In service at position P-14 of the square. It is taken up, stored and placed again at Q-01.','En servei a la posició P-14 de la plaça. Es desmunta, passa a estoc i es torna a col·locar a Q-01.']},
  {kick:['05 · RETORNO','05 · RETURN','05 · RETORN'],title:['El final puede ser otro inicio.','An ending can be a beginning.','El final pot ser un altre inici.'],text:['El retorno queda registrado. La materia puede volver al ciclo; la identidad sigue con ella.','The return is recorded. The material can go back into the loop; the identity stays with it.','El retorn queda registrat. La matèria pot tornar al cicle; la identitat continua amb ella.']},
 ],
 chShort:[['Origen','Origin','Origen'],['Materia','Material','Matèria'],['Identidad','Identity','Identitat'],['Uso','Use','Ús'],['Retorno','Return','Retorn']],
 // labels in the scene
 tagSub:['J2 · 150 × 75 mm · maqueta','J2 · 150 × 75 mm · scale model','J2 · 150 × 75 mm · maqueta'],
 tarp:['Lona de refit','Refit tarp','Lona de refit'],
 flakes:['Escama de PE','PE flakes','Escama de PE'],
 board:['Plancha de PE reciclado','Recycled PE board','Planxa de PE reciclat'],
 peLayer:['PE reciclado · 20 mm','Recycled PE · 20 mm','PE reciclat · 20 mm'],
 concreteLayer:['Hormigón · 80 mm','Concrete · 80 mm','Formigó · 80 mm'],
 format:['3 × 1,5 m · formato de proyecto','3 × 1.5 m · project format','3 × 1,5 m · format de projecte'],
 mass:['≈ 990 kg estimados · 220 kg/m²','≈ 990 kg estimated · 220 kg/m²','≈ 990 kg estimats · 220 kg/m²'],
 passportCard:['PASAPORTE DE MATERIAL','MATERIAL PASSPORT','PASSAPORT DE MATERIAL'],
 batch:['Lote','Batch','Lot'],
 readings:['lecturas registradas · 16 oct 2026','recorded readings · 16 Oct 2026','lectures registrades · 16 oct 2026'],
 integrity:['Secuencia SHA-256 comprobada · 810 eventos','SHA-256 sequence checked · 810 events','Seqüència SHA-256 comprovada · 810 esdeveniments'],
 composition:['PE reciclado + hormigón','Recycled PE + concrete','PE reciclat + formigó'],
 phases:{F1:['Plancha','Board','Planxa'],F2:['Pieza','Piece','Peça'],F3:['En tránsito','In transit','En trànsit'],F4:['Instalada P-14','Installed P-14','Instal·lada P-14'],F5:['En servicio','In service','En servei'],F6:['Stock','Stock','Estoc'],F7:['Instalada Q-01','Installed Q-01','Instal·lada Q-01'],F8:['Retorno','Return','Retorn']},
 quay:['Moll · Port Vell','Quay · Port Vell','Moll · Port Vell'],
 reuse:['Q-01 · reúso','Q-01 · reuse','Q-01 · reús'],
 // tap cards
 info:{
  pe:{title:['PE reciclado','Recycled PE','PE reciclat'],text:['Capa de 20 mm hecha con plástico recuperado de lonas de refit del Puerto. Es la capa que lleva la memoria del material.','20 mm layer made from plastic recovered from port refit tarps. It carries the material’s memory.','Capa de 20 mm feta amb plàstic recuperat de lones de refit del Port. És la capa que porta la memòria del material.']},
  concrete:{title:['Hormigón','Concrete','Formigó'],text:['Capa superior de 80 mm en el formato de proyecto. Junto con el PE forma una pieza bicomponente de plaza.','80 mm upper layer in the project format. With the PE it forms a two-material paving component.','Capa superior de 80 mm en el format de projecte. Amb el PE forma una peça bicomponent de plaça.']},
  piece:{title:['M-14 · tu maqueta','M-14 · your model','M-14 · la teva maqueta'],text:['J2 de 150 × 75 × 4 mm. Representa una pieza de 3 × 1,5 m. El QR la identifica y sitúa esta escena sobre ella.','J2, 150 × 75 × 4 mm. It represents a 3 × 1.5 m component. The QR identifies it and places this scene on it.','J2 de 150 × 75 × 4 mm. Representa una peça de 3 × 1,5 m. El QR la identifica i situa aquesta escena a sobre.']},
  passport:{title:['Pasaporte CUEVA-BCN-M-14','Passport CUEVA-BCN-M-14','Passaport CUEVA-BCN-M-14'],text:['Identidad, composición, lecturas registradas y procedencia de cada dato. Ábrelo completo desde el botón Pasaporte.','Identity, composition, recorded readings and the source of each figure. Open it in full from the Passport button.','Identitat, composició, lectures registrades i procedència de cada dada. Obre’l complet des del botó Passaport.']},
  phase:{title:['Lectura registrada','Recorded reading','Lectura registrada'],text:['Lectura de la maqueta en la prueba de campo del stand. Es un registro histórico, no el estado en directo del puerto.','Scale-model reading from the stand field test. It is a historical record, not the live state of the port.','Lectura de la maqueta a la prova de camp de l’estand. És un registre històric, no l’estat en directe del port.']},
 },
};
export const tr=(entry,lang)=>Array.isArray(entry)?entry[lang==='en'?1:lang==='ca'?2:0]:entry;
