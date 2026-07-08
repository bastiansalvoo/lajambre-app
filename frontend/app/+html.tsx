import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Este archivo personaliza el HTML raíz de la versión web de la app.
 * Solo aplica en builds web (expo export -p web). 
 * No afecta iOS ni Android en absoluto.
 * 
 * El CSS aquí centra la app en pantallas de PC, emulando un celular
 * centrado en un fondo oscuro — exactamente como hacen Instagram, TikTok, etc.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* Viewport crítico: sin esto en móvil la página se ve tiny */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        
        {/* FUENTE ROBOTO PARA IGUALAR EXPO ANDROID */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />

        {/* Reset de estilos de ScrollView de Expo (necesario) */}
        <ScrollViewStyleReset />
        {/*
          CSS WEB-ONLY: Centra la app en pantalla de PC
          El #root es el div raíz de React Native Web.
          body + display:flex + justify-content:center = centra el #root
          #root con max-width:480px emula la pantalla del celular
          Esta técnica es la misma que usan las grandes apps (TikTok, Threads, etc.)
        */}
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              background-color: #111;
            }
            body {
              display: flex;
              justify-content: center;
              align-items: stretch;
            }
            #root {
              flex: 1;
              max-width: 480px;
              width: 100%;
              background-color: #000;
              min-height: 100vh;
              overflow: hidden;
              position: relative;
            }
            /* Forzar Roboto en todos los textos de React Native Web */
            #root div[dir="auto"] {
              font-family: 'Roboto', sans-serif !important;
            }
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
