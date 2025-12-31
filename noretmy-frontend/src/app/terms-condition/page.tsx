import React from "react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto  px-4 sm:px-6 lg:px-8 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-6 py-8 border-b border-gray-100">
          <h1 className="text-3xl font-semibold text-gray-800">Terms and Conditions of Use</h1>
          <p className="mt-2 text-gray-500">Please read these terms carefully before using our services</p>
        </div>
        
        <div className="px-6 py-6">
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">1. Owner Identification</h2>
            <p className="text-gray-600">
              This website is owned by Noretmy LLC, based in New Mexico, USA registered at Philadelphia Pike #7584, Claymont, 19703..
            </p>
            <p className="text-gray-600 mt-2">
              Contact email: <a href="mailto:info@noretmy.com" className="text-blue-600 hover:text-blue-800">info@noretmy.com</a>
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">2. Purpose of the Website</h2>
            <p className="text-gray-600">
              The purpose of the website is to offer digital services to businesses and individuals.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">3. Terms of Use</h2>
            <p className="text-gray-600">
              Access to and browsing of the site implies full and unreserved acceptance of these terms and conditions. The user agrees to make appropriate use of the content and not to use it for illegal or unlawful activities.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">4. Contracting Services</h2>
            <p className="text-gray-600 mb-2">
              Users may contract digital services in accordance with the specific conditions indicated in each case (price, payment method, delivery times, etc.).
            </p>
            <p className="text-gray-600">
              Noretmy LLC reserves the right to reject a request if it detects fraudulent use or non-compliance.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">5. Intellectual Property</h2>
            <p className="text-gray-600">
              All content (text, images, code, logos, etc.) is the property of Noretmy LLC or is licensed under a valid license. Unauthorized reproduction is prohibited.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">6. Disclaimer of Warranties and Liability</h2>
            <p className="text-gray-600">
              Noretmy LLC does not guarantee the continuous availability of the site nor is it responsible for technical errors or damages arising from the use of the site or services.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">7. Data Protection</h2>
            <p className="text-gray-600">
              The processing of personal data will be governed by the provisions of the Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">8. Modifications</h2>
            <p className="text-gray-600">
              Noretmy LLC may modify these terms at any time. Changes will be effective upon posting.
            </p>
          </section>
            <section className="mb-4">
              <h2 className="text-xl font-medium text-gray-700 mb-3">9. Applicable Law and Jurisdiction</h2>
              <p className="text-gray-600">
                These terms are governed by the laws of the State of New Mexico, USA.
              </p>
              <p className="text-gray-600 mt-2">
              Any disputes will be resolved in the courts of that state.
            </p>
          </section>

           <section className="mb-4">
              <h2 className="text-xl font-medium text-gray-700 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-600">
          Noretmy LLC is not responsible for any misuse of the website's content, nor for any damages or losses arising from its use or access. The owner reserves the right to modify the content and elements of the website at any time without prior notice.
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