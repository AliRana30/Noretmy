"use client";

import React from "react";
import { useTranslations } from "@/hooks/useTranslations";

export default function TermsAndConditions() {
  const { getCurrentLanguage } = useTranslations();
  const isSpanish = getCurrentLanguage()?.toLowerCase().startsWith("es");

  const content = isSpanish
    ? {
        title: "Terminos y condiciones de uso",
        subtitle: "Por favor, lea estos terminos antes de usar nuestros servicios.",
        sections: [
          {
            title: "1. Identificacion del titular",
            body: "Este sitio web pertenece a Noretmy LLC, registrada en 2093 Philadelphia Pike #7584, Claymont, DE 19703, Estados Unidos.",
          },
          {
            title: "2. Objeto del sitio web",
            body: "El objetivo del sitio es ofrecer servicios digitales para empresas y particulares.",
          },
          {
            title: "3. Condiciones de uso",
            body: "El acceso y uso del sitio implica la aceptacion total de estas condiciones. El usuario se compromete a no usar el sitio para actividades ilegales.",
          },
          {
            title: "4. Contratacion de servicios",
            body: "Los usuarios pueden contratar servicios digitales segun las condiciones de cada servicio. Noretmy LLC puede rechazar solicitudes con indicios de fraude o incumplimiento.",
          },
          {
            title: "5. Propiedad intelectual",
            body: "Todo el contenido del sitio pertenece a Noretmy LLC o esta licenciado legalmente. Queda prohibida la reproduccion sin autorizacion.",
          },
          {
            title: "6. Limitacion de responsabilidad",
            body: "Noretmy LLC no garantiza disponibilidad continua del sitio y no responde por danos derivados de errores tecnicos o uso indebido.",
          },
          {
            title: "7. Proteccion de datos",
            body: "El tratamiento de datos personales se rige por nuestra Politica de Privacidad.",
          },
          {
            title: "8. Modificaciones",
            body: "Noretmy LLC puede actualizar estos terminos en cualquier momento. Los cambios entran en vigor al publicarse.",
          },
          {
            title: "9. Ley aplicable y jurisdiccion",
            body: "Estos terminos se rigen por las leyes del Estado de Nuevo Mexico, Estados Unidos. Cualquier disputa se resolvera en sus tribunales competentes.",
          },
        ],
      }
    : {
        title: "Terms and Conditions of Use",
        subtitle: "Please read these terms carefully before using our services.",
        sections: [
          {
            title: "1. Owner Identification",
            body: "This website is owned by Noretmy LLC, registered at 2093 Philadelphia Pike #7584, Claymont, DE 19703, United States.",
          },
          {
            title: "2. Purpose of the Website",
            body: "The website provides digital services for businesses and individuals.",
          },
          {
            title: "3. Terms of Use",
            body: "Accessing and using this site implies full acceptance of these terms. Users must not use the platform for illegal activities.",
          },
          {
            title: "4. Contracting Services",
            body: "Users can contract digital services according to each service conditions. Noretmy LLC may reject requests in case of fraud or policy violations.",
          },
          {
            title: "5. Intellectual Property",
            body: "All website content belongs to Noretmy LLC or is properly licensed. Unauthorized reproduction is prohibited.",
          },
          {
            title: "6. Limitation of Liability",
            body: "Noretmy LLC does not guarantee uninterrupted availability and is not liable for damages caused by technical issues or misuse.",
          },
          {
            title: "7. Data Protection",
            body: "Personal data processing is governed by our Privacy Policy.",
          },
          {
            title: "8. Modifications",
            body: "Noretmy LLC may update these terms at any time. Updates become effective when published.",
          },
          {
            title: "9. Applicable Law and Jurisdiction",
            body: "These terms are governed by the laws of the State of New Mexico, United States. Any dispute is subject to its competent courts.",
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
            <h2 className="text-xl font-medium text-gray-700 mb-3">
              {isSpanish ? "Contacto" : "Contact"}
            </h2>
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