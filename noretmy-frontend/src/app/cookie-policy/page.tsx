import React from 'react';
import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
            <p className="mt-2 text-orange-100">Last Updated: December 2024</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-6">
                This Cookie Policy explains how Noretmy LLC (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) uses cookies 
                and similar technologies to recognize you when you visit our website. It explains what 
                these technologies are and why we use them, as well as your rights to control our use of them.
              </p>

              {/* What are cookies */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                1. What Are Cookies?
              </h2>
              <p className="text-gray-600 mb-6">
                Cookies are small data files that are placed on your computer or mobile device when you 
                visit a website. Cookies are widely used by website owners in order to make their websites 
                work, or to work more efficiently, as well as to provide reporting information.
              </p>
              <p className="text-gray-600 mb-6">
                Cookies set by the website owner (in this case, Noretmy) are called &quot;first-party cookies&quot;. 
                Cookies set by parties other than the website owner are called &quot;third-party cookies&quot;. 
                Third-party cookies enable third-party features or functionality to be provided on or 
                through the website (e.g., advertising, interactive content, and analytics).
              </p>

              {/* Types of cookies */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                2. Types of Cookies We Use
              </h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Essential Cookies</h3>
                <p className="text-gray-600">
                  These cookies are strictly necessary to provide you with services available through our 
                  website and to use some of its features, such as access to secure areas. Without these 
                  cookies, services you have asked for cannot be provided.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Performance Cookies</h3>
                <p className="text-gray-600">
                  These cookies collect information about how visitors use our website, for instance which 
                  pages visitors go to most often. We use this information to improve our website and to 
                  help us measure the effectiveness of our advertising.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Functionality Cookies</h3>
                <p className="text-gray-600">
                  These cookies allow our website to remember choices you make (such as your language 
                  preference or the region you are in) and provide enhanced, more personalized features.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Targeting/Advertising Cookies</h3>
                <p className="text-gray-600">
                  These cookies are used to deliver advertisements more relevant to you and your interests. 
                  They are also used to limit the number of times you see an advertisement as well as help 
                  measure the effectiveness of the advertising campaign.
                </p>
              </div>

              {/* Cookie table */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                3. Specific Cookies We Use
              </h2>
              <div className="overflow-x-auto mb-6">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cookie Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Purpose</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">session_id</td>
                      <td className="px-4 py-3 text-sm text-gray-600">User authentication and session management</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">i18nextLng</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Stores your language preference</td>
                      <td className="px-4 py-3 text-sm text-gray-600">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">cookie_consent</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Stores your cookie consent preferences</td>
                      <td className="px-4 py-3 text-sm text-gray-600">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">_ga</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Google Analytics - distinguishes users</td>
                      <td className="px-4 py-3 text-sm text-gray-600">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Managing cookies */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                4. How to Manage Cookies
              </h2>
              <p className="text-gray-600 mb-4">
                You can set your browser to refuse all or some browser cookies, or to alert you when 
                websites set or access cookies. If you disable or refuse cookies, please note that some 
                parts of this website may become inaccessible or not function properly.
              </p>
              <p className="text-gray-600 mb-6">
                Most web browsers allow some control of most cookies through the browser settings. 
                To find out more about cookies, including how to see what cookies have been set, 
                visit <a href="https://www.allaboutcookies.org" className="text-orange-600 hover:text-orange-700" target="_blank" rel="noopener noreferrer">www.allaboutcookies.org</a>.
              </p>

              {/* Updates */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                5. Updates to This Policy
              </h2>
              <p className="text-gray-600 mb-6">
                We may update this Cookie Policy from time to time in order to reflect changes to the 
                cookies we use or for other operational, legal, or regulatory reasons. Please therefore 
                revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
              </p>

              {/* Contact */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                6. Contact Us
              </h2>
              <p className="text-gray-600 mb-6">
                If you have any questions about our use of cookies or other technologies, please email us at{' '}
                <a href="mailto:privacy@noretmy.com" className="text-orange-600 hover:text-orange-700">
                  privacy@noretmy.com
                </a>.
              </p>

              {/* Related links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Related Policies</h3>
                <div className="flex flex-wrap gap-4">
                  <Link href="/privacy-policy" className="text-orange-600 hover:text-orange-700 hover:underline">
                    Privacy Policy
                  </Link>
                  <Link href="/terms-condition" className="text-orange-600 hover:text-orange-700 hover:underline">
                    Terms & Conditions
                  </Link>
                  <Link href="/legal-notice" className="text-orange-600 hover:text-orange-700 hover:underline">
                    Legal Notice
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Noretmy LLC. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
