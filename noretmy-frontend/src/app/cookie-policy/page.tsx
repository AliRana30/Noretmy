"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "@/hooks/useTranslations";

export default function CookiePolicyPage() {
  const { getCurrentLanguage } = useTranslations();
  const isSpanish = getCurrentLanguage()?.toLowerCase().startsWith("es");

  const content = isSpanish
    ? {
        title: "Politica de cookies",
        updated: "Ultima actualizacion: Abril 2026",
        intro:
          "Esta politica explica como Noretmy LLC usa cookies y tecnologias similares para mejorar la experiencia, seguridad y analitica del sitio.",
        sections: [
          {
            title: "1. Que son las cookies",
            body: "Las cookies son pequenos archivos que se almacenan en su dispositivo cuando visita un sitio web.",
          },
          {
            title: "2. Tipos de cookies que usamos",
            body: "Usamos cookies esenciales (inicio de sesion y seguridad), funcionales (preferencias de idioma) y analiticas (rendimiento y uso).",
          },
          {
            title: "3. Gestion de cookies",
            body: "Puede bloquear o eliminar cookies desde su navegador. Algunas funciones pueden dejar de funcionar correctamente si se desactivan cookies esenciales.",
          },
          {
            title: "4. Contacto",
            body: "Para consultas sobre privacidad o cookies, escriba a privacy@noretmy.com.",
          },
        ],
      }
    : {
        title: "Cookie Policy",
        updated: "Last Updated: April 2026",
        intro:
          "This policy explains how Noretmy LLC uses cookies and similar technologies for site experience, security, and analytics.",
        sections: [
          {
            title: "1. What Cookies Are",
            body: "Cookies are small files stored on your device when you visit a website.",
          },
          {
            title: "2. Types of Cookies We Use",
            body: "We use essential cookies (authentication and security), functional cookies (language preferences), and analytics cookies (performance and usage).",
          },
          {
            title: "3. Managing Cookies",
            body: "You can block or delete cookies in your browser settings. Some features may not work properly if essential cookies are disabled.",
          },
          {
            title: "4. Contact",
            body: "For privacy or cookie questions, contact privacy@noretmy.com.",
          },
        ],
      };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">{content.title}</h1>
            <p className="mt-2 text-orange-100">{content.updated}</p>
          </div>

          <div className="p-8 prose max-w-none">
            <p className="text-gray-600 mb-6">{content.intro}</p>

            {content.sections.map((section) => (
              <section key={section.title} className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">{section.title}</h2>
                <p className="text-gray-600">{section.body}</p>
              </section>
            ))}

            <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4 flex-wrap">
              <Link href="/privacy-policy" className="text-orange-600 hover:text-orange-700 hover:underline">
                {isSpanish ? "Politica de privacidad" : "Privacy Policy"}
              </Link>
              <Link href="/terms-condition" className="text-orange-600 hover:text-orange-700 hover:underline">
                {isSpanish ? "Terminos y condiciones" : "Terms and Conditions"}
              </Link>
              <Link href="/legal-notice" className="text-orange-600 hover:text-orange-700 hover:underline">
                {isSpanish ? "Aviso legal" : "Legal Notice"}
              </Link>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Noretmy LLC. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}