// Public texts of the M-14 experience (ES / EN / CA). Data figures come from data/m14.json.
export const LANGS=['es','en','ca'];
export function pickLang(){
 const q=new URLSearchParams(location.search).get('lang');if(LANGS.includes(q))return q;
 try{const s=localStorage.getItem('m14-lang');if(LANGS.includes(s))return s}catch{}
 const n=(navigator.language||'es').slice(0,2);return n==='ca'?'ca':n==='en'?'en':'es';
}
export const T={
 entryKicker:['PASAPORTE VIVO · {id} / {family}','LIVING PASSPORT · {id} / {family}','PASSAPORT VIU · {id} / {family}'],
 entryKickerBag:['PASAPORTE VIVO · SACA / LOTE','LIVING PASSPORT · BAG / BATCH','PASSAPORT VIU · SACA / LOT'],
 entryTitleBag:['Despierta<br><em>la saca.</em>','Wake<br><em>the bag.</em>','Desperta<br><em>la saca.</em>'],
 entryLeadBag:['Apunta al QR de la saca. Verás de dónde viene su escama y cómo se reparte en las 20 piezas del muelle.','Point at the QR on the bag. See where its flakes come from and how they are shared among the 20 pieces of the quay.','Apunta al QR de la saca. Veuràs d’on ve la seva escama i com es reparteix en les 20 peces del moll.'],
 allPieces:['Todas las piezas','All pieces','Totes les peces'],
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
 markerMode:['Unida al QR','Attached to the QR','Unida al QR'],
 holdStill:['Mantén el móvil quieto un instante.','Hold the phone still for a moment.','Mantén el mòbil quiet un instant.'],
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
  {kick:['02 · MATERIA','02 · MATERIAL','02 · MATÈRIA'],title:['Dos capas. Una identidad.','Two layers. One identity.','Dues capes. Una identitat.'],text:['{pe} mm de PE reciclado y {canto} mm de hormigón en el formato de proyecto de {fw} × {fd} m.','{pe} mm of recycled PE and {canto} mm of concrete in the {fw} × {fd} m project format.','{pe} mm de PE reciclat i {canto} mm de formigó en el format de projecte de {fw} × {fd} m.']},
  {kick:['03 · IDENTIDAD','03 · IDENTITY','03 · IDENTITAT'],title:['{id} recuerda cada paso.','{id} remembers every step.','{id} recorda cada pas.'],text:['Su pasaporte guarda las lecturas registradas en la prueba de campo, de la plancha al retorno.','Its passport keeps the readings recorded in the field test, from board to return.','El seu passaport guarda les lectures registrades a la prova de camp, de la planxa al retorn.']},
  null,
  {kick:['05 · RETORNO','05 · RETURN','05 · RETORN'],title:['El final puede ser otro inicio.','An ending can be a beginning.','El final pot ser un altre inici.'],text:['El retorno queda registrado. La materia puede volver al ciclo; la identidad sigue con ella.','The return is recorded. The material can go back into the loop; the identity stays with it.','El retorn queda registrat. La matèria pot tornar al cicle; la identitat continua amb ella.']},
 ],
 zone:{
  plaza:{kick:['04 · USO Y REÚSO','04 · USE & REUSE','04 · ÚS I REÚS'],title:['Cambia de lugar. Sigue siendo {id}.','A different place. Still {id}.','Canvia de lloc. Continua sent {id}.'],text:['En servicio en la posición {pos} de la plaza. Se desmonta, pasa a stock y vuelve a colocarse en {reuse}.','In service at position {pos} of the square. It is taken up, stored and placed again at {reuse}.','En servei a la posició {pos} de la plaça. Es desmunta, passa a estoc i es torna a col·locar a {reuse}.']},
  paseo:{kick:['04 · USO','04 · USE','04 · ÚS'],title:['Un paseo junto al agua.','A promenade by the water.','Un passeig vora l’aigua.'],text:['En servicio en el paseo del muelle, posición {pos}. Miles de pasos sobre una pieza que recuerda su origen.','In service on the quay promenade, position {pos}. Thousands of steps on a piece that remembers its origin.','En servei al passeig del moll, posició {pos}. Milers de passos sobre una peça que recorda el seu origen.']},
  vial:{kick:['04 · USO','04 · USE','04 · ÚS'],title:['Hecha para el tráfico del puerto.','Built for port traffic.','Feta per al trànsit del port.'],text:['Pieza de vial en la posición {pos}. Por eso su capa de hormigón es de {canto} mm, casi tres veces la de una pieza peatonal.','A roadway piece at position {pos}. That is why its concrete layer is {canto} mm, almost three times that of a pedestrian piece.','Peça de vial a la posició {pos}. Per això la seva capa de formigó és de {canto} mm, gairebé tres vegades la d’una peça per a vianants.']},
  plataforma:{kick:['04 · USO','04 · USE','04 · ÚS'],title:['Una plataforma de trabajo.','A working platform.','Una plataforma de treball.'],text:['En la plataforma de operaciones, posición {pos}: carga, descarga y maniobras de cada día sobre la misma identidad.','On the operations platform, position {pos}: daily loading, unloading and handling on the same identity.','A la plataforma d’operacions, posició {pos}: càrrega, descàrrega i maniobres de cada dia sobre la mateixa identitat.']},
  borde:{kick:['04 · USO','04 · USE','04 · ÚS'],title:['En el borde del muelle.','At the edge of the quay.','A la vora del moll.'],text:['Posición {pos}, junto al agua, donde amarran las barcas. Sal, humedad y uso intenso: su pasaporte lo registra.','Position {pos}, by the water, where boats moor. Salt, damp and heavy use: its passport records it.','Posició {pos}, vora l’aigua, on amarren les barques. Sal, humitat i ús intens: el passaport ho registra.']},
 },
 zoneLabel:{plaza:['Plaza','Square','Plaça'],paseo:['Paseo','Promenade','Passeig'],vial:['Vial','Roadway','Vial'],plataforma:['Plataforma','Platform','Plataforma'],borde:['Borde del muelle','Quay edge','Vora del moll']},
 bagCh:[
  {kick:['01 · REFIT','01 · REFIT','01 · REFIT'],title:['Las lonas que protegían los barcos.','The tarps that protected the boats.','Les lones que protegien els vaixells.'],text:['En la zona de refit del Port Vell, las fundas de PE se retiran al terminar cada trabajo.','In the Port Vell refit area, PE covers are removed at the end of each job.','A la zona de refit del Port Vell, les fundes de PE es retiren en acabar cada treball.']},
  {kick:['02 · ESCAMA','02 · FLAKES','02 · ESCAMA'],title:['Triturar sin perder el rastro.','Shredding without losing track.','Triturar sense perdre el rastre.'],text:['La lona se tritura en escama y llena esta saca. Desde ese momento tiene lote: {batch}.','The tarp is shredded into flakes that fill this bag. From then on it has a batch: {batch}.','La lona es tritura en escama i omple aquesta saca. Des d’aquell moment té lot: {batch}.']},
  {kick:['03 · LOTE','03 · BATCH','03 · LOT'],title:['Una saca, un lote, un registro.','One bag, one batch, one record.','Una saca, un lot, un registre.'],text:['La lectura F0 abre el ciclo: ninguna pieza nace sin leer antes la saca. Peso estimado: {kg} kg.','Reading F0 opens the cycle: no piece is born before the bag is read. Estimated weight: {kg} kg.','La lectura F0 obre el cicle: cap peça neix sense llegir abans la saca. Pes estimat: {kg} kg.']},
  {kick:['04 · VEINTE PIEZAS','04 · TWENTY PIECES','04 · VINT PECES'],title:['De la saca al muelle.','From the bag to the quay.','De la saca al moll.'],text:['El lote se reparte en las planchas de las 20 piezas: paseo, vial, plataforma, plaza y borde.','The batch is shared among the boards of the 20 pieces: promenade, roadway, platform, square and edge.','El lot es reparteix en les planxes de les 20 peces: passeig, vial, plataforma, plaça i vora.']},
  {kick:['05 · CICLO','05 · LOOP','05 · CICLE'],title:['Todo vuelve a empezar aquí.','It all starts again here.','Tot torna a començar aquí.'],text:['Cuando una pieza retorna, su materia puede volver a una saca con nuevo lote y la misma memoria.','When a piece returns, its material can go back into a bag with a new batch and the same memory.','Quan una peça retorna, la seva matèria pot tornar a una saca amb un nou lot i la mateixa memòria.']},
 ],
 bagShort:[['Refit','Refit','Refit'],['Escama','Flakes','Escama'],['Lote','Batch','Lot'],['Elige','Choose','Tria'],['Ciclo','Loop','Cicle']],
 bagTitle:['La saca','The bag','La saca'],
 piecesOfBatch:['20 piezas · 5 zonas','20 pieces · 5 zones','20 peces · 5 zones'],
 chShort:[['Origen','Origin','Origen'],['Materia','Material','Matèria'],['Identidad','Identity','Identitat'],['Uso','Use','Ús'],['Retorno','Return','Retorn']],
 // labels in the scene
 tagSub:['{family} · {mmw} × {mmd} mm · maqueta','{family} · {mmw} × {mmd} mm · scale model','{family} · {mmw} × {mmd} mm · maqueta'],
 tarp:['Lona de refit','Refit tarp','Lona de refit'],
 flakes:['Escama de PE','PE flakes','Escama de PE'],
 board:['Plancha de PE reciclado','Recycled PE board','Planxa de PE reciclat'],
 peLayer:['PE reciclado · {pe} mm','Recycled PE · {pe} mm','PE reciclat · {pe} mm'],
 concreteLayer:['Hormigón · {canto} mm','Concrete · {canto} mm','Formigó · {canto} mm'],
 format:['{fw} × {fd} m · formato de proyecto','{fw} × {fd} m · project format','{fw} × {fd} m · format de projecte'],
 mass:['≈ {kg} kg estimados · 220 kg/m²','≈ {kg} kg estimated · 220 kg/m²','≈ {kg} kg estimats · 220 kg/m²'],
 passportCard:['PASAPORTE DE MATERIAL','MATERIAL PASSPORT','PASSAPORT DE MATERIAL'],
 batch:['Lote','Batch','Lot'],
 readings:['lecturas registradas · 16 oct 2026','recorded readings · 16 Oct 2026','lectures registrades · 16 oct 2026'],
 integrity:['Secuencia SHA-256 comprobada · 810 eventos','SHA-256 sequence checked · 810 events','Seqüència SHA-256 comprovada · 810 esdeveniments'],
 composition:['PE reciclado + hormigón','Recycled PE + concrete','PE reciclat + formigó'],
 phases:{F1:['Plancha','Board','Planxa'],F2:['Pieza','Piece','Peça'],F3:['En tránsito','In transit','En trànsit'],F4:['Instalada {pos}','Installed {pos}','Instal·lada {pos}'],F5:['En servicio','In service','En servei'],F6:['Stock','Stock','Estoc'],F7:['Instalada {reuse}','Installed {reuse}','Instal·lada {reuse}'],F8:['Retorno','Return','Retorn']},
 quay:['Moll · Port Vell','Quay · Port Vell','Moll · Port Vell'],
 reuse:['{reuse} · reúso','{reuse} · reuse','{reuse} · reús'],
 // tap cards
 info:{
  pe:{title:['PE reciclado','Recycled PE','PE reciclat'],text:['Capa de 20 mm hecha con plástico recuperado de lonas de refit del Puerto. Es la capa que lleva la memoria del material.','20 mm layer made from plastic recovered from port refit tarps. It carries the material’s memory.','Capa de 20 mm feta amb plàstic recuperat de lones de refit del Port. És la capa que porta la memòria del material.']},
  concrete:{title:['Hormigón','Concrete','Formigó'],text:['Capa superior de {canto} mm en el formato de proyecto. Junto con el PE forma una pieza bicomponente.','{canto} mm upper layer in the project format. With the PE it forms a two-material component.','Capa superior de {canto} mm en el format de projecte. Amb el PE forma una peça bicomponent.']},
  piece:{title:['{id} · tu maqueta','{id} · your model','{id} · la teva maqueta'],text:['{family} de {mmw} × {mmd} × 4 mm. Representa una pieza de {fw} × {fd} m. El QR la identifica y sitúa esta escena sobre ella.','{family}, {mmw} × {mmd} × 4 mm. It represents a {fw} × {fd} m component. The QR identifies it and places this scene on it.','{family} de {mmw} × {mmd} × 4 mm. Representa una peça de {fw} × {fd} m. El QR la identifica i situa aquesta escena a sobre.']},
  bag:{title:['Saca · LOTE-BCN-PE-001','Bag · LOTE-BCN-PE-001','Saca · LOTE-BCN-PE-001'],text:['La saca reúne la escama de PE de las lonas de refit. Su lote es el que heredan las 20 piezas del muelle.','The bag holds the PE flakes from the refit tarps. Its batch is the one inherited by the 20 pieces of the quay.','La saca reuneix l’escama de PE de les lones de refit. El seu lot és el que hereten les 20 peces del moll.']},
  passport:{title:['Pasaporte CUEVA-BCN-M-14','Passport CUEVA-BCN-M-14','Passaport CUEVA-BCN-M-14'],text:['Identidad, composición, lecturas registradas y procedencia de cada dato. Ábrelo completo desde el botón Pasaporte.','Identity, composition, recorded readings and the source of each figure. Open it in full from the Passport button.','Identitat, composició, lectures registrades i procedència de cada dada. Obre’l complet des del botó Passaport.']},
  phase:{title:['Lectura registrada','Recorded reading','Lectura registrada'],text:['Lectura de la maqueta en la prueba de campo del stand. Es un registro histórico, no el estado en directo del puerto.','Scale-model reading from the stand field test. It is a historical record, not the live state of the port.','Lectura de la maqueta a la prova de camp de l’estand. És un registre històric, no l’estat en directe del port.']},
 },
};
export const tr=(entry,lang)=>Array.isArray(entry)?entry[lang==='en'?1:lang==='ca'?2:0]:entry;
/** Number with the language's decimal mark. */
export const num=(n,lang)=>n==null?'—':(Math.round(n*100)/100).toLocaleString(lang==='en'?'en-GB':lang==='ca'?'ca-ES':'es-ES');
/** Fill {placeholders} from vars. */
export const fmt=(s,vars={})=>String(s).replace(/\{(\w+)\}/g,(m,k)=>vars[k]??m);
/** Placeholder values for one piece in one language. */
export function pieceVars(piece,passport,lang){
 return{id:piece.id,family:piece.family,mmw:piece.modelMm[0],mmd:piece.modelMm[1],fw:num(piece.projectM[0],lang),fd:num(piece.projectM[1],lang),
  pe:piece.peMm,canto:piece.concreteMm,pos:piece.position,reuse:piece.reuse||'—',
  kg:num(passport?.metrics?.estimatedFullScaleMassKg??passport?.metrics?.estimatedMassKg,lang),batch:passport?.identity?.batchReference||'LOTE-BCN-PE-001'};
}
