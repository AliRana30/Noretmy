import Link from 'next/link';
import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-black px-6 py-8">
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-2 text-blue-100">Last Updated: March 4, 2025</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-6">
                This Privacy Policy describes how your personal information is
                collected, used, and shared when you visit or make a purchase
                from our website. We are committed to ensuring that your privacy is protected
                and maintained in accordance with all applicable data protection laws and regulations.
                Please read this privacy policy carefully to
                understand our policies and practices regarding your personal
                data and how we will treat it throughout your interactions with us.
              </p>

              {/* Introduction Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-600 mb-6">
                At Noretmy, we respect your privacy and are committed to
                protecting your personal data. This privacy policy will inform
                you about how we look after your personal data when you visit
                our website and tell you about your privacy rights and how the
                law protects you. We recognize the importance of maintaining your privacy
                and keeping your personal information secure. We designed this policy to be
                transparent about our practices and to ensure you have full control over how
                your information is used. Our commitment extends beyond mere legal compliance –
                we believe in establishing trust through ethical data handling practices and
                being accountable for how we process your information at every stage of our relationship.
              </p>

              {/* Data Collection Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                2. Data We Collect
              </h2>
              <p className="text-gray-600 mb-3">
                We may collect, use, store and transfer different kinds of
                personal data about you which we have grouped together as
                follows. Our collection methods are designed to gather only what is necessary
                to provide you with the best service possible, while respecting your privacy rights
                and preferences:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                <li>
                  <strong>Identity Data</strong> includes first name, last name,
                  username or similar identifier, title, date of birth, and gender if voluntarily provided.
                  This information helps us personalize your experience and address you appropriately.
                </li>
                <li>
                  <strong>Contact Data</strong> includes billing address,
                  delivery address, email address and telephone numbers. This information is essential
                  for processing orders, delivering products, and communicating important updates regarding
                  your purchases or account.
                </li>
                <li>
                  <strong>Financial Data</strong> includes payment card details and billing information.
                  We implement strict security measures to protect this sensitive information and only
                  retain what is necessary for processing transactions and preventing fraud.
                </li>
                <li>
                  <strong>Transaction Data</strong> includes details about payments to and from you
                  and other details of products and services you have purchased from us. This helps us
                  maintain accurate records and provide better customer service regarding past purchases.
                </li>
                <li>
                  <strong>Technical Data</strong> includes internet protocol
                  (IP) address, browser type and version, time zone setting and
                  location, browser plug-in types and versions, operating system
                  and platform, and other technology on the devices you use to access our website.
                  This information helps us optimize your browsing experience and troubleshoot technical issues.
                </li>
                <li>
                  <strong>Usage Data</strong> includes information about how you
                  use our website, products and services, such as page views, time spent on pages,
                  navigation paths, and features used. This helps us understand which aspects of our
                  service are most valuable and which areas might need improvement.
                </li>
                <li>
                  <strong>Marketing and Communications Data</strong> includes your preferences
                  in receiving marketing from us and our third parties and your communication preferences.
                  We respect these choices and use this information to ensure we only send you content
                  that matches your stated interests.
                </li>
              </ul>

              {/* How We Use Your Data Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                3. How We Use Your Data
              </h2>
              <p className="text-gray-600 mb-3">
                We will only use your personal data when the law allows us to.
                Most commonly, we will use your personal data in the following
                circumstances. For each use case, we ensure there is a valid legal basis
                and that processing is proportionate to the stated purpose:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                <li>
                  Where we need to perform the contract we are about to enter
                  into or have entered into with you, such as processing your order,
                  managing your account, and providing customer support related to your purchases.
                </li>
                <li>
                  Where it is necessary for our legitimate interests (or those
                  of a third party) and your interests and fundamental rights do
                  not override those interests. This includes analyzing usage patterns to improve
                  our website, preventing fraud, and ensuring the security of our systems.
                </li>
                <li>
                  Where we need to comply with a legal obligation, including maintaining
                  appropriate business records, responding to law enforcement requests, and
                  adhering to tax regulations and consumer protection laws.
                </li>
                <li>
                  Where you have given consent for specific processing activities, such as
                  receiving marketing communications or participating in optional surveys.
                  You may withdraw this consent at any time without affecting the lawfulness of
                  processing before its withdrawal.
                </li>
                <li>
                  To send you important updates about our terms, conditions, and policies or
                  other administrative information essential to your ongoing relationship with us.
                </li>
                <li>
                  To measure or understand the effectiveness of advertising we serve to you and others,
                  and to deliver relevant advertising to you, using techniques that minimize data usage
                  while maximizing relevance.
                </li>
                <li>
                  To make suggestions and recommendations to you about goods or services that may
                  be of interest to you, based on your stated preferences, past purchases, and usage patterns.
                </li>
              </ul>

              {/* Data Retention Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                4. Data Retention
              </h2>
              <p className="text-gray-600 mb-6">
                We will only retain your personal data for as long as reasonably
                necessary to fulfill the purposes we collected it for, including
                for the purposes of satisfying any legal, regulatory, tax,
                accounting or reporting requirements. We may retain your
                personal data for a longer period in the event of a complaint or
                if we reasonably believe there is a prospect of litigation. To determine the appropriate
                retention period for personal data, we consider the amount, nature, and sensitivity
                of the personal data, the potential risk of harm from unauthorized use or disclosure,
                the purposes for which we process the data and whether we can achieve those purposes
                through other means, and the applicable legal, regulatory, tax, accounting, or other requirements.
                For instance, transaction records may be kept for several years to comply with tax laws,
                while marketing preferences might be reviewed and updated more frequently. In some circumstances,
                we may anonymize your personal data (so that it can no longer be associated with you) for research
                or statistical purposes, in which case we may use this information indefinitely without further notice to you.
              </p>

              {/* Your Rights Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                5. Your Rights
              </h2>
              <p className="text-gray-600 mb-3">
                Under certain circumstances, you have rights under data
                protection laws in relation to your personal data. We are committed to facilitating
                the exercise of these rights and ensuring you have control over your information.
                Your rights include:
              </p>
              <ul className="list-disc pl-6 mb-6 text-gray-600 space-y-2">
                <li>
                  <strong>Request access to your personal data</strong> (commonly known as a "data subject access request").
                  This enables you to receive a copy of the personal data we hold about you and to verify that we are
                  lawfully processing it. We will respond to valid requests within 30 days.
                </li>
                <li>
                  <strong>Request correction of your personal data</strong> that we hold about you. This enables you
                  to have any incomplete or inaccurate data we hold about you corrected, though we may need to verify
                  the accuracy of the new data you provide to us.
                </li>
                <li>
                  <strong>Request erasure of your personal data</strong>. This enables you to ask us to delete or
                  remove personal data where there is no good reason for us continuing to process it. You also have the
                  right to ask us to delete or remove your personal data where you have successfully exercised your right
                  to object to processing, where we may have processed your information unlawfully, or where we are
                  required to erase your personal data to comply with local law.
                </li>
                <li>
                  <strong>Object to processing of your personal data</strong> where we are relying on a legitimate
                  interest and there is something about your particular situation which makes you want to object to
                  processing on this ground as you feel it impacts on your fundamental rights and freedoms.
                </li>
                <li>
                  <strong>Request restriction of processing your personal data</strong>. This enables you to ask
                  us to suspend the processing of your personal data in specific scenarios: if you want us to establish
                  the data's accuracy; where our use of the data is unlawful but you do not want us to erase it; where
                  you need us to hold the data even if we no longer require it as you need it to establish, exercise or
                  defend legal claims; or you have objected to our use of your data but we need to verify whether we have
                  overriding legitimate grounds to use it.
                </li>
                <li>
                  <strong>Request transfer of your personal data</strong> to you or to a third party. We will provide
                  to you, or a third party you have chosen, your personal data in a structured, commonly used,
                  machine-readable format.
                </li>
                <li>
                  <strong>Right to withdraw consent</strong> at any time where we are relying on consent to process
                  your personal data. However, this will not affect the lawfulness of any processing carried out before
                  you withdraw your consent.
                </li>
              </ul>

              {/* Cookies Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                6. Cookies
              </h2>
              <p className="text-gray-600 mb-6">
                Cookies are small text files that are placed on your computer by
                websites that you visit. They are widely used in order to make
                websites work, or work more efficiently, as well as to provide
                information to the owners of the site. You can set your browser
                to refuse all or some browser cookies, or to alert you when
                websites set or access cookies. We use several types of cookies on our website
                for different purposes. Essential cookies enable core functionality such as security,
                verification of identity, and network management. These cookies can't be disabled.
                Functional cookies enhance functionality by remembering your choices and preferences,
                while performance cookies collect information about how you use our site, helping us
                improve its features. Marketing cookies track your online activity to help deliver targeted
                advertising. Our cookie policy provides detailed information on the specific cookies we use,
                their purpose, and how long they remain on your device. You have the option to manage your
                cookie preferences at any time through our cookie preference center accessible on our website.
              </p>

              {/* Changes to Policy Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                7. Changes to This Policy
              </h2>
              <p className="text-gray-600 mb-6">
                We may update our privacy policy from time to time to reflect changes in our practices,
                in response to new regulations, or to incorporate feedback from our users. Material changes
                will be clearly identified and we will provide notice prior to the changes taking effect where
                appropriate. We will notify you of any changes by posting the new privacy policy on
                this page and updating the "Last Updated" date at the top of
                this privacy policy. You are advised to review this privacy
                policy periodically for any changes. For significant changes, we may also notify you through
                the email address you have provided to us or through a prominent notice on our website. Historical
                versions of our privacy policy are archived and available upon request for your reference. We are
                committed to transparency in how we evolve our data practices and welcome your feedback on our policies.
              </p>

              {/* Contact Section */}
              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                8. Contact Us
              </h2>
              <p className="text-gray-600 mb-3">
                If you have any questions about this privacy policy or our
                privacy practices, would like to exercise any of your data protection rights,
                or need assistance understanding any aspect of this policy, please contact us:
              </p>
              <div className="pl-6 text-gray-600 mb-6">
                <p>
                  <strong>Email:</strong> info@noretmy.com
                </p>
                <p>
                  <strong>Address:</strong> 2093 Philadelphia Pike #7584, Claymont, DE 19703
                </p>
                {/* <p>
                  <strong>Data Protection Officer:</strong> privacy@noretmy.com
                </p> */}
              </div>

              {/* Footer */}
              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  If you have any questions or concerns about our Privacy Policy
                  or data practices, please contact us using the information
                  provided above. We are committed to resolving any complaints about our collection
                  or use of your personal data promptly and fairly. If you are not satisfied with our response,
                  you may have the right to lodge a complaint with your local data protection authority.
                </p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;