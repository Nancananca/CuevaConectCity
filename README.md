# CuevaConectCity · prueba M-14

## Subir a GitHub
1. Descomprime el ZIP en tu ordenador.
2. En github.com/nancananca/CuevaConectCity abre Add file > Upload files.
3. Sube TODO EL CONTENIDO extraído a la raíz, con sus carpetas assets, css, data, js y vendor. index.html debe quedar directamente en la raíz, no dentro de otra carpeta. No subas el ZIP sin descomprimir.
4. Confirma los archivos en main.
5. Settings > Pages > Build and deployment > Deploy from a branch > main > /(root) > Save.
6. Espera a que GitHub indique que está publicado y abre https://nancananca.github.io/CuevaConectCity/ . Si ves 404, espera al despliegue; no cambies el QR.

No necesitas Node, Python ni una compilación para publicar esta carpeta. .nojekyll evita el procesamiento de Jekyll; si el diálogo oculta ese archivo, selecciona mostrar archivos ocultos. No hay archivos privados, lector ni registros brutos del Puerto en este paquete.

## QR único
Imprime assets/target/qr-unico-m14.pdf al 100%, sin ajustar a página, en mate. Etiqueta principal25x25mm INCLUYE margen blanco. Cara superior, esquina INFERIOR DERECHA; deja5mm hasta borde derecho e inferior y conserva orientación y margen blanco. No la dobles sobre el canto de4mm.
El PDF incluye30mm para comparar. Si lo usas, cambia el ancho QR a30mm y aplica de nuevo la esquina. El QR está generado para la URL de GitHub indicada; no regenerarlo con otro servicio sin recompilar la referencia AR.

## Probar
1. Escanea el QR con iPhone/Safari o Android/Chrome.
2. En el pasaporte pulsa Ver en tu mesa.
3. Anclar al QR de la maqueta: permite cámara y mantén QR visible. No hace falta tarjeta adicional. Acércate hasta que tenga detalle suficiente.
4. Colocar animación en mi espacio (iPhone): abre Quick Look, busca una superficie y coloca la escena. No necesita seguir viendo el QR; no reconoce automáticamente la maqueta.
5. Explorar historia en3D permite revisar los cinco capítulos sin cámara. Toca PE u hormigón para conocerlos y Panel de datos para ver el registro histórico.
6. Ajustar pieza: J1 7.5x7.5cm, J2 15x7.5cm, J4 15x15cm, J6 22.5x15cm; todas4mm. Tras cambiar geometría o tamañoQR pulsa Aplicar esquina inferior derecha. Puedes guardar ajuste e informe en ese móvil.

La ficha mantiene la identidadM-14. Los cambios J son geometrías de prueba, no pasaportes individuales. M14=J4 es la hipótesis de trabajo derivada de la medida15x15. El reparto de las capas de4mm es ilustrativo; los20/80mm del pasaporte son dimensiones del proyecto.

## Comprobado y pendiente
Prueba anterior: usuario confirmó éxito en iPhoneSafari con tarjeta ilustrada en la pantalla delPC. Esa prueba no valida el nuevoQR.
Nuevo paquete: reconocimiento y pose del QR comprobados sobre imágenes sintéticas; modelosUSDZ y animación validados con OpenUSD; flujos3D y rutas revisados. Pendiente prueba física del QR impreso y QuickLook en iPhone. La aplicación no graba ni sube vídeo.
La publicación es copia de consulta; no hay conexión en directo con el lector del stand. GitHubPages solo sirve los archivos estáticos.

Fuentes técnicas: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site y https://developer.apple.com/documentation/arkit/previewing-a-model-with-ar-quick-look .
