import React from "react";

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto  px-4 sm:px-6 lg:px-8 bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="bg-blue-50 px-6 py-8 border-b border-gray-100">
          <h1 className="text-3xl font-semibold text-gray-800">Legal Notice</h1>
          <p className="mt-2 text-gray-500">Important information about Noretmy LLC</p>
        </div>
        
        <div className="px-6 py-6">
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Website Owner</h2>
            <p className="text-gray-600">
              In compliance with the duty of information stipulated in current regulations, we inform you that this website is owned by Noretmy LLC, a limited liability company registered at Noretmy LLC  
2093 Philadelphia Pike #7584  
Claymont, DE 19703  
United States
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Contact Information</h2>
            <p className="text-gray-600">
              For any questions or to contact the website owner, please contact the following email address:{" "}
              <a href="mailto:info@noretmy.com" className="text-blue-600 hover:text-blue-800">
                info@noretmy.com
              </a>
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Purpose</h2>
            <p className="text-gray-600">
              The purpose of this website is to offer digital services to both businesses and individuals. Access to and use of the site confers the status of user and implies full acceptance of this Legal Notice.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Intellectual and Industrial Property</h2>
            <p className="text-gray-600">
              All content on the website, including text, images, designs, logos, source code, etc., is the property of Noretmy LLC or third parties, and is protected by intellectual and industrial property rights. Reproduction in whole or in part without express authorization is prohibited.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Personal Data Protection</h2>
            <p className="text-gray-600">
              The personal data provided by the user through contact forms or other means will be treated in accordance with applicable data protection legislation. For more information, please see our Privacy Policy.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Liability</h2>
            <p className="text-gray-600">
              Noretmy LLC is not responsible for any misuse of the website's content, nor for any damages or losses arising from its use or access. The owner reserves the right to modify the content and elements of the website at any time without prior notice.
            </p>
          </section>
          
          <section className="mb-4">
            <h2 className="text-xl font-medium text-gray-700 mb-3">Applicable Law and Jurisdiction</h2>
            <p className="text-gray-600">
              This Legal Notice is governed by the laws applicable in the United States, specifically in the state of New Mexico. In the event of a dispute, the parties shall submit to the competent courts of that state.
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