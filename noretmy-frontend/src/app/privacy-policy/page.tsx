"use client";

import React from "react";
import { useTranslations } from "@/hooks/useTranslations";

const PrivacyPolicyPage: React.FC = () => {
  const { getCurrentLanguage } = useTranslations();
  const isSpanish = getCurrentLanguage()?.toLowerCase().startsWith("es");

  const content = isSpanish
    ? {
        title: "Politica de privacidad",
        updated: "Ultima actualizacion: Abril 2026",
        intro:
          "Esta politica describe como recopilamos, usamos y protegemos sus datos personales cuando usa Noretmy.",
        sections: [
          {
            title: "1. Datos que recopilamos",
            body: "Podemos recopilar datos de identidad, contacto, transacciones, uso tecnico y preferencias de comunicacion.",
          },
          {
            title: "2. Como usamos sus datos",
            body: "Usamos sus datos para prestar servicios, procesar pagos, prevenir fraude, mejorar la plataforma y cumplir obligaciones legales.",
          },
          {
            title: "3. Conservacion de datos",
            body: "Conservamos los datos solo durante el tiempo necesario para fines operativos, legales, fiscales o de seguridad.",
          },
          {
            title: "4. Sus derechos",
            body: "Puede solicitar acceso, correccion, eliminacion, limitacion de tratamiento y retiro de consentimiento segun normativa aplicable.",
          },
          {
            title: "5. Contacto",
            body: "Para consultas de privacidad, escriba a info@noretmy.com.",
          },
        ],
      }
    : {
        title: "Privacy Policy",
        updated: "Last Updated: April 2026",
        intro:
          "This policy describes how we collect, use, and protect your personal data when you use Noretmy.",
        sections: [
          {
            title: "1. Data We Collect",
            body: "We may collect identity, contact, transaction, technical usage, and communication preference data.",
          },
          {
            title: "2. How We Use Data",
            body: "We use data to provide services, process payments, prevent fraud, improve the platform, and meet legal obligations.",
          },
          {
            title: "3. Data Retention",
            body: "We keep personal data only as long as needed for operational, legal, tax, and security purposes.",
          },
          {
            title: "4. Your Rights",
            body: "You can request access, correction, deletion, restriction, and consent withdrawal under applicable regulations.",
          },
          {
            title: "5. Contact",
            body: "For privacy requests, email info@noretmy.com.",
          },
        ],
      };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-black px-6 py-8">
            <h1 className="text-3xl font-bold text-white">{content.title}</h1>
            <p className="mt-2 text-blue-100">{content.updated}</p>
          </div>

          <div className="p-8 prose max-w-none">
            <p className="text-gray-600 mb-6">{content.intro}</p>

            {content.sections.map((section) => (
              <section key={section.title} className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">{section.title}</h2>
                <p className="text-gray-600">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;