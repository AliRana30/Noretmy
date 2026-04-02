"use client";

import React from "react";
import { useTranslations } from "@/hooks/useTranslations";

export default function LegalNotice() {
  const { getCurrentLanguage } = useTranslations();
  const isSpanish = getCurrentLanguage()?.toLowerCase().startsWith("es");

  const content = isSpanish
    ? {
        title: "Aviso legal",
        subtitle: "Informacion importante sobre Noretmy LLC",
        sections: [
          {
            title: "Titular del sitio web",
            body: "Este sitio web pertenece a Noretmy LLC, registrada en 2093 Philadelphia Pike #7584, Claymont, DE 19703, Estados Unidos.",
          },
          {
            title: "Finalidad",
            body: "La finalidad del sitio es ofrecer servicios digitales a empresas y particulares.",
          },
          {
            title: "Propiedad intelectual e industrial",
            body: "Todo el contenido del sitio (textos, imagenes, logos y codigo) pertenece a Noretmy LLC o a terceros con licencia valida.",
          },
          {
            title: "Proteccion de datos",
            body: "Los datos personales se tratan conforme a la normativa aplicable y a nuestra Politica de Privacidad.",
          },
          {
            title: "Responsabilidad",
            body: "Noretmy LLC no se responsabiliza por uso indebido del sitio ni por danos derivados del acceso o uso del servicio.",
          },
          {
            title: "Ley aplicable y jurisdiccion",
            body: "Este aviso legal se rige por la legislacion del Estado de Nuevo Mexico, Estados Unidos.",
          },
        ],
      }
    : {
        title: "Legal Notice",
        subtitle: "Important information about Noretmy LLC",
        sections: [
          {
            title: "Website Owner",
            body: "This website is owned by Noretmy LLC, registered at 2093 Philadelphia Pike #7584, Claymont, DE 19703, United States.",
          },
          {
            title: "Purpose",
            body: "The purpose of this website is to provide digital services for businesses and individuals.",
          },
          {
            title: "Intellectual and Industrial Property",
            body: "All content on this site (text, images, logos, and source code) belongs to Noretmy LLC or licensed third parties.",
          },
          {
            title: "Personal Data Protection",
            body: "Personal data is processed in accordance with applicable regulations and our Privacy Policy.",
          },
          {
            title: "Liability",
            body: "Noretmy LLC is not liable for misuse of this site or damages arising from access or use of the platform.",
          },
          {
            title: "Applicable Law and Jurisdiction",
            body: "This legal notice is governed by the laws of the State of New Mexico, United States.",
          },
        ],
      };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto  px-4 sm:px-6 lg:px-8 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-6 py-8 border-b border-gray-100">
          <h1 className="text-3xl font-semibold text-gray-800">{content.title}</h1>
          <p className="mt-2 text-gray-500">{content.subtitle}</p>
        </div>
        
        <div className="px-6 py-6">
          {content.sections.map((section) => (
            <section key={section.title} className="mb-8">
              <h2 className="text-xl font-medium text-gray-700 mb-3">{section.title}</h2>
              <p className="text-gray-600">{section.body}</p>
            </section>
          ))}

          <section className="mb-4">
            <h2 className="text-xl font-medium text-gray-700 mb-3">{isSpanish ? "Contacto" : "Contact Information"}</h2>
            <p className="text-gray-600">
              Email: <a href="mailto:info@noretmy.com" className="text-blue-600 hover:text-blue-800">info@noretmy.com</a>
            </p>
          </section>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Noretmy LLC. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}