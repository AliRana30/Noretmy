'use client';
import React, { useRef, useState, useEffect } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Search,
  ChevronRight,
  ArrowUp,
  Plus,
  Minus,
  BookOpen,
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Promotional Plans',
    question: 'What are the promotional plans in Noretmy?',
    answer:
      'Promotional plans allow freelancers to boost their services, making them more visible to potential clients. You can promote a single service or all of your services.',
  },
  {
    category: 'Promotional Plans',
    question: 'Can I subscribe to a promotional plan for a single service?',
    answer:
      'Yes, you can purchase a promotional plan for a specific service at the time of its creation.',
  },
  {
    category: 'Promotional Plans',
    question: 'Is there an option to promote all my services at once?',
    answer:
      'Yes, you can choose a promotional plan that applies to all your services instead of just one.',
  },
  {
    category: 'Promotional Plans',
    question: 'Are promotional plan fees refundable?',
    answer:
      'No, all purchases of promotional plans are non-refundable, even if you decide to stop the promotion before the 30-day period ends.',
  },
  {
    category: 'Promotional Plans',
    question: 'How much does a promotional plan cost?',
    answer:
      "The price of promotional plans varies. You can check the available options in your account's promotion settings.",
  },
  {
    category: 'Promotional Plans',
    question: 'Is there a service fee for purchasing a promotional plan?',
    answer: 'Yes, a 2% service fee applies to all promotional plan purchases.',
  },
  {
    category: 'Promotional Plans',
    question: 'How long does a promotional plan last?',
    answer: 'The duration of all plans is 30 calendar days.',
  },
  {
    category: 'Promotional Plans',
    question: 'Can I change or upgrade my promotional plan after purchasing?',
    answer:
      'No, once a promotional plan is purchased, it cannot be modified. However, you can buy a new plan after the current one expires.',
  },
  {
    category: 'Promotional Plans',
    question: 'Will my promotional plan renew automatically?',
    answer:
      'No, promotional plans do not renew automatically. You must manually subscribe again once your plan expires.',
  },
  {
    category: 'Promotional Plans',
    question: 'Can I pause or cancel a promotional plan after activation?',
    answer:
      'No, promotional plans cannot be stopped or canceled once activated.',
  },

  {
    category: 'Service Management',
    question: 'How can I list my services on Noretmy?',
    answer:
      "Go to your profile, click on 'Create a Service,' and provide details, pricing, and delivery time.",
  },
  {
    category: 'Service Management',
    question: 'Can I edit or delete a service after publishing it?',
    answer: 'Yes, you can edit or deactivate your service at any time.',
  },
  {
    category: 'Service Management',
    question: 'How do I get more visibility for my services?',
    answer:
      'You can use promotional plans with a 2% service fee, optimize your service description, and maintain good ratings.',
  },
  {
    category: 'Service Management',
    question: 'What happens if a client does not provide enough information?',
    answer: 'You can request more details through chat before starting work.',
  },

  {
    category: 'Buying Services',
    question: 'How do I hire a professional?',
    answer:
      'Browse the services, select a professional, and place an order. You can also message freelancers before purchasing.',
  },
  {
    category: 'Buying Services',
    question: 'Can I request a custom offer from a freelancer?',
    answer:
      'Yes, freelancers can send custom offers based on your specific needs.',
  },
  {
    category: 'Buying Services',
    question: 'What happens if a freelancer cancels my order?',
    answer:
      'You will receive a full refund and have the option to hire another freelancer.',
  },
  {
    category: 'Buying Services',
    question: 'Can I negotiate prices with freelancers?',
    answer:
      'Freelancers set their own prices, but some may be open to negotiation through custom offers.',
  },
  {
    category: 'Account & Profile',
    question: 'How do I create an account on Noretmy.com?',
    answer:
      'You can sign up using your email and password. Just follow the registration steps and verify your email.',
  },
  {
    category: 'Account & Profile',
    question: 'Can I change my username after creating an account?',
    answer:
      'No, usernames cannot be changed once registered. If you need a change for a valid reason, contact support.',
  },
  {
    category: 'Account & Profile',
    question: 'How do I verify my account?',
    answer:
      'Check the email we sent to your inbox and verify your account to start listing your services on our platform.',
  },
  {
    category: 'Account & Profile',
    question: 'Can I delete or deactivate my account?',
    answer:
      'Yes, you can request account deletion or deactivation in the Settings menu. Some data may be retained for legal purposes.',
  },
  {
    category: 'Account & Profile',
    question: 'Is there a rating or review system on Noretmy?',
    answer:
      'Yes, both freelancers and clients can leave reviews (star ratings) and comments after completing an order.',
  },

  {
    category: 'Withdrawals & Fees',
    question: 'What is the minimum withdrawal amount?',
    answer:
      'The minimum withdrawal amount is $20. Freelancers must have at least $20 in their available balance before requesting a withdrawal.',
  },
  {
    category: 'Withdrawals & Fees',
    question: 'How often can freelancers withdraw their earnings?',
    answer:
      "Freelancers can withdraw earnings based on the platform's withdrawal policies, considering the 3% + $0.35 withdrawal fee per transaction.",
  },
  {
    category: 'Withdrawals & Fees',
    question: 'How does the currency conversion fee work?',
    answer:
      'If your transaction involves converting to another currency, a 3.5% conversion fee is applied to the total converted amount.',
  },
  {
    category: 'Withdrawals & Fees',
    question: 'Are there lower commission rates for high-volume freelancers?',
    answer:
      'Currently, the 15% freelancer commission is standard for all users. Any changes will be announced in platform updates.',
  },
  {
    category: 'Withdrawals & Fees',
    question: 'Where can I see a breakdown of fees for my transactions?',
    answer:
      "You can view all commission deductions, withdrawal fees, and conversion charges in the 'Transaction History' section of your account.",
  },

  {
    category: 'Commission & Fees',
    question: 'What is the commission fee for freelancers?',
    answer: 'Freelancers are charged a 15% commission on each completed order.',
  },
  {
    category: 'Commission & Fees',
    question: 'What commission do clients pay when purchasing a service?',
    answer: 'Clients pay a 2% commission on the total order value.',
  },
  {
    category: 'Commission & Fees',
    question: 'Is there a fee for withdrawing my earnings?',
    answer: 'Yes, there is a withdrawal fee of 3% + $0.35 per transaction.',
  },
  {
    category: 'Commission & Fees',
    question: 'Do I have to pay a currency conversion fee?',
    answer:
      'If your withdrawal or payment involves currency conversion, a 3.5% conversion fee will be applied.',
  },
  {
    category: 'Commission & Fees',
    question: 'How are freelancer commissions deducted from earnings?',
    answer:
      'The 15% freelancer commission is automatically deducted from the payment before the funds are credited to your balance.',
  },
  {
    category: 'Commission & Fees',
    question:
      'Is the 5% client commission charged per transaction or per order?',
    answer:
      'The 5% commission applies to the total order value at the time of purchase.',
  },
  {
    category: 'Commission & Fees',
    question: 'Does the withdrawal fee apply to all payment methods?',
    answer:
      'Yes, the 3% + $0.35 USD withdrawal fee applies regardless of the payment method used.',
  },
  {
    category: 'Commission & Fees',
    question: 'Are commissions refundable if an order is canceled?',
    answer:
      'If an order is canceled and refunded, commissions may also be refunded depending on the case.',
  },

  {
    category: 'VAT & Taxes',
    question: 'Do clients have to pay VAT?',
    answer:
      "Yes, clients must pay VAT based on their country's tax regulations. The applicable VAT rate will be calculated and added at checkout.",
  },
  {
    category: 'VAT & Taxes',
    question: 'How is VAT determined for my purchase?',
    answer:
      'VAT is calculated based on your billing address and local tax laws. The exact amount will be displayed before completing payment.',
  },
  {
    category: 'VAT & Taxes',
    question: 'Is VAT included in the service price?',
    answer:
      'No, VAT is added separately at checkout and is not included in the freelancer’s service price.',
  },
  {
    category: 'VAT & Taxes',
    question: 'What if I am charged VAT but my country does not require it?',
    answer:
      'VAT charges are based on the billing address you provide. If you believe you were charged incorrectly, contact customer support for assistance.',
  },
  {
    category: 'VAT & Taxes',
    question: 'Are there additional taxes besides VAT?',
    answer:
      'The platform only applies VAT where legally required. Any other local taxes are the user’s responsibility.',
  },
  {
    category: 'VAT & Taxes',
    question:
      'Does VAT and the 5% service fee apply to all transactions on the platform?',
    answer:
      'Yes, both VAT and the 5% service fee apply to all purchases on the platform, whether made by clients or freelancers.',
  },

  {
    category: 'General',
    question: 'How does Noretmy work?',
    answer:
      'Clients can browse freelancer profiles to find suitable professionals. Freelancers offer their services, and both parties collaborate through the platform.',
  },
  {
    category: 'General',
    question: 'Who can join Noretmy?',
    answer:
      'Anyone 18 years or older can join as a freelancer or client, as long as they comply with our Terms of Service.',
  },

  {
    category: 'Privacy & Security',
    question: 'Does Noretmy share my data with third parties?',
    answer:
      'We do not sell or share your personal data with third parties without your consent. Check our Privacy Policy for more details.',
  },
  {
    category: 'Privacy & Security',
    question: 'Can I delete my account and all associated data?',
    answer:
      'Yes, you can deactivate your account through account settings. Some transaction data may be retained for legal or security reasons.',
  },
  {
    category: 'Privacy & Security',
    question: 'How does Noretmy prevent fraud on the platform?',
    answer:
      'We use secure payment gateways, identity verification processes, and fraud detection systems to ensure a safe marketplace.',
  },
  {
    category: 'Privacy & Security',
    question: 'Are payments on Noretmy secure?',
    answer:
      'Yes, all transactions are processed through encrypted and secure payment gateways to protect your financial information.',
  },

  {
    category: 'Disputes & Conflict Resolution',
    question:
      'What should I do if I have a dispute with a freelancer or client?',
    answer:
      'Try to resolve the issue through direct communication. If no resolution is reached, you can escalate the dispute to our support team.',
  },
  {
    category: 'Disputes & Conflict Resolution',
    question: 'How does the dispute resolution process work?',
    answer:
      'Once a dispute is raised, our team reviews the case, evaluates evidence from both parties, and makes a fair decision based on platform policies.',
  },
  {
    category: 'Disputes & Conflict Resolution',
    question: 'What happens if a freelancer does not meet the agreed deadline?',
    answer:
      'You can request an update, extend the deadline, or cancel the order if full payment has not been made. If you have chosen installment payments, you may cancel the order and hire another freelancer.',
  },
  {
    category: 'Platform Policies & Guidelines',
    question: 'What are the rules for using Noretmy?',
    answer:
      'Users must comply with our Terms of Service, which include guidelines on ethical behavior, fair use, and prohibited activities.',
  },
  {
    category: 'Platform Policies & Guidelines',
    question: 'Are there any restrictions on the types of services offered?',
    answer:
      'Yes, services involving illegal, fraudulent, or unethical activities are strictly prohibited.',
  },
  {
    category: 'Platform Policies & Guidelines',
    question:
      "What happens if a user does not comply with the platform's policies?",
    answer:
      'A policy violation may result in a warning, suspension, or permanent account ban, depending on the severity of the violation.',
  },
  {
    category: 'Platform Policies & Guidelines',
    question: 'Can I have multiple accounts on Noretmy.com?',
    answer:
      'No, users are allowed only one account. Multiple accounts may lead to suspension unless explicitly permitted by our support team.',
  },

  {
    category: 'Technical Support & Troubleshooting',
    question: 'I am having trouble accessing my account. What should I do?',
    answer:
      'Clear your browser cache, try a different device, or reset your password. If the issue persists, contact support.',
  },
  {
    category: 'Technical Support & Troubleshooting',
    question: 'My payment has not been processed. What should I do?',
    answer:
      'Check your payment details, try a different method, or contact your bank. If the issue continues, reach out to our support team.',
  },
  {
    category: 'Technical Support & Troubleshooting',
    question: 'Why is my service not appearing in search results?',
    answer:
      'New listings may take time to appear. Ensure your service is in the correct category, uses relevant keywords, and complies with platform guidelines.',
  },
  {
    category: 'Technical Support & Troubleshooting',
    question: 'How can I report a technical issue?',
    answer:
      "Use the 'Report an Issue' option in your account settings or contact customer support via email with details of the problem at info@noretmy.com.",
  },

  {
    category: 'Community & Support',
    question: 'Does Noretmy offer customer support?',
    answer:
      'Yes, we provide customer support via email. Our response time is estimated between 24 to 72 hours.',
  },
  {
    category: 'Community & Support',
    question: 'Where can I find tutorials or guides on using the platform?',
    answer:
      'Visit our help center or blog section for detailed guides, tips, and best practices for using Noretmy.',
  },
  {
    category: 'Community & Support',
    question: 'How does Noretmy work?',
    answer:
      'Noretmy is a platform designed to increase visibility and help businesses or freelancers reach more clients and grow their revenue.',
  },
  {
    category: 'Community & Support',
    question:
      'In which currency is the commission calculated between the client and freelancer?',
    answer: 'The commission is calculated in US dollars.',
  },

  {
    category: 'General',
    question: 'What is Noretmy?',
    answer:
      'Noretmy is a platform that connects businesses and freelancers with clients looking for digital services, whether for projects or tasks completed via video calls.',
  },
  {
    category: 'Pricing & Fees',
    question: "What is Noretmy's commission for freelancers?",
    answer: 'Noretmy charges a 15% commission on earnings.',
  },
  {
    category: 'Pricing & Fees',
    question: 'What is the commission for each client purchase?',
    answer:
      'A commission of 2% plus applicable VAT for each service contracted.',
  },
  {
    category: 'Payments & Withdrawals',
    question: 'When can I withdraw my money?',
    answer:
      '14 days after completing a job, with a minimum balance of $20 accumulated in your account.',
  },
  {
    category: 'Payments & Withdrawals',
    question: 'How long does it take for the money to reach my account?',
    answer: 'Approximately 3 to 7 business days.',
  },
  {
    category: 'Payments & Withdrawals',
    question: 'When will I see my money reflected in Noretmy?',
    answer:
      'A maximum of 14 days after completing a job and marking it as completed.',
  },

  {
    category: 'Account & Profile',
    question: 'How can I register on Noretmy?',
    answer:
      'To register, visit our website, click on the signup button, and follow the instructions to create your account.',
  },
  {
    category: 'Account & Profile',
    question: 'How much does it cost to register on Noretmy?',
    answer: 'Registration on Noretmy is completely free.',
  },
  {
    category: 'Service Management',
    question: 'How can I publish a job?',
    answer:
      "To publish a job, go to your freelancer dashboard, click 'Create Service,' fill in the required details, and submit for approval.",
  },
  {
    category: 'Service Management',
    question: 'In what format can I upload photos or videos to my profile?',
    answer:
      'Videos can be uploaded in FLV and MP4 formats, and photos in JPG, JPEG, and PNG formats.',
  },
  {
    category: 'Service Management',
    question: 'What types of projects can I publish on Noretmy?',
    answer:
      'You can publish services related to psychology, law, design, programming, writing, marketing, and many other digital services.',
  },
  {
    category: 'Client Services',
    question: 'How can I find freelancers for my project?',
    answer:
      'Search for freelancers using the search bar with relevant keywords or by browsing categories.',
  },
  {
    category: 'Service Pricing',
    question: 'How is the price of a job determined?',
    answer:
      'The price is agreed upon between the client and the freelancer. You can discuss it via chat and create a custom offer.',
  },
  {
    category: 'Pricing & Fees',
    question: 'How does the payment process work?',
    answer:
      'Payments are managed through Noretmy. Funds are held in escrow until the job is completed and the freelancer marks it as complete.',
  },
  {
    category: 'Pricing & Fees',
    question: 'How much does it cost to use Noretmy as a client?',
    answer: 'A commission of 5% per service contracted, plus applicable VAT.',
  },
  {
    category: 'Quality Standards',
    question: 'How is the quality of a job guaranteed?',
    answer:
      "You can review the freelancer's profile, ratings, and reviews before hiring.",
  },
  {
    category: 'Client Services',
    question: 'What should I do if I am not satisfied with the work done?',
    answer:
      'Communicate with the freelancer and try to resolve the issue. If the issue remains unresolved, contact us for assistance.',
  },

  {
    category: 'Disputes & Conflict Resolution',
    question: 'What happens if a freelancer does not meet the agreed deadline?',
    answer:
      'You should contact the freelancer via our chat and, if necessary, establish new deadlines.',
  },
  {
    category: 'Disputes & Conflict Resolution',
    question: 'How are disputes between clients and freelancers handled?',
    answer:
      'Disputes should be resolved between the freelancer and the client. If no agreement is reached, we can mediate and help find a fair solution for both parties.',
  },

  {
    category: 'Privacy & Security',
    question: 'What security measures protect my personal data?',
    answer:
      'Noretmy uses advanced security measures to protect your data. Check our privacy policy for more details.',
  },
  {
    category: 'Community & Support',
    question: 'Does Noretmy provide assistance?',
    answer:
      'Yes, we offer support via email to help with any issues or questions you may have.',
  },
  {
    category: 'Freelancer',
    question: 'How can I increase my chances of being hired as a freelancer?',
    answer:
      'You can promote your service by paying a small fee to gain more visibility. We offer four pricing plans to highlight your services and help you get more sales.',
  },
  {
    category: 'Account Management',
    question: 'Can I change my username?',
    answer: 'ANSWER',
  },
  {
    category: 'Refund Policy',
    question: "What is Noretmy's refund policy?",
    answer:
      "The client will be refunded if the freelancer does not complete the agreed work. The refunded amount will be added to the client's Noretmy balance, which can be used to hire another freelancer. However, the money cannot be withdrawn from the platform.",
  },
  {
    category: 'Freelancer',
    question: 'Can I have multiple active projects at the same time?',
    answer:
      'Yes, you can have multiple active projects on Noretmy, but you must meet the deadlines agreed upon with the client.',
  },
  {
    category: 'Privacy & Security',
    question: 'How does Noretmy prevent fraud?',
    answer:
      'Noretmy has security measures in place to detect and prevent fraudulent activities. If fraudulent activity is detected, the user will receive an email warning. If it happens again, the user will be reported and removed from the platform.',
  },
  {
    category: 'General',
    question: 'Can I work on projects from anywhere in the world?',
    answer:
      'Noretmy is a global platform that allows freelancers and businesses to work from almost any location.',
  },
  {
    category: 'Intellectual Property',
    question: "What is Noretmy's intellectual property policy?",
    answer:
      'Intellectual property is governed by the terms agreed upon between the client and the freelancer for each project. Both parties should sign a contract (NDA) if the project is confidential or requires copyright protection.',
  },
  {
    category: 'Project Management',
    question: 'What happens if a freelancer abandons my project?',
    answer:
      'If a freelancer abandons the project without notifying the client, after 14 business days, the client will be entitled to a refund in their Noretmy balance to hire another freelancer. The freelancer will also be reported on the platform.',
  },
  {
    category: 'Account Management',
    question: 'How can I change my password?',
    answer: 'ANSWER',
  },
  {
    category: 'Privacy & Security',
    question:
      'Does Noretmy offer protection against contract breaches between freelancers and clients?',
    answer:
      'No, it depends on the contract terms agreed upon by the freelancer and the client. Noretmy cannot provide protection.',
  },
  {
    category: 'Privacy & Security',
    question: 'What if my project is confidential?',
    answer:
      'You can sign a Non-Disclosure Agreement (NDA) with the freelancer before sharing confidential details to protect intellectual property rights.',
  },
  {
    category: 'Project Management',
    question: 'Can I change the terms of a project once it has started?',
    answer:
      'Changes in project terms must be mutually agreed upon between the freelancer and the client. If an extension is required, a new offer must be made with the necessary adjustments.',
  },
  {
    category: 'Quality Standards',
    question: "What is Noretmy's policy regarding work quality?",
    answer:
      "Noretmy promotes high-quality standards. Clients can leave reviews and comments and view freelancers' profiles to check their project history. Freelancers with too many negative reviews may be reported and removed from Noretmy.",
  },
  {
    category: 'Quality Standards',
    question: "How can I verify a freelancer's experience?",
    answer:
      "Check the freelancer's profile to see their project history, as well as reviews and comments from previous clients.",
  },
  {
    category: 'Quality Standards',
    question:
      'What should I do if a freelancer does not meet agreed expectations?',
    answer:
      'Clearly communicate your expectations. If they are not met, provide feedback so the freelancer can make the necessary changes.',
  },
  {
    category: 'Project Management',
    question: 'Can I hire a freelancer by the hour?',
    answer:
      'Yes, you can hire a freelancer on an hourly basis, as well as for short-term or long-term projects. You can also communicate via video call through Noretmy.',
  },
  {
    category: 'Refund Policy',
    question: 'Where will my money be deposited if I receive a refund?',
    answer:
      'Your refunded money will be added to your Noretmy balance. You can view it in your profile.',
  },
  {
    category: 'Feedback',
    question: 'Can I provide feedback to freelancers?',
    answer:
      'Yes, you can communicate with the freelancer through Noretmy’s internal chat.',
  },
  {
    category: 'Account Management',
    question: 'Can I change my username?',
    answer: 'ANSWER',
  },
  {
    category: 'Account Management',
    question: 'Can I change my registered email address on Noretmy?',
    answer:
      'Yes, you can update your registered email address from your profile settings.',
  },
  {
    category: 'Account Management',
    question: 'What should I do if I forget my password?',
    answer:
      "You can reset your password by clicking on 'Forgot your password?'. A reset link will be sent to your registered email.",
  },
  {
    category: 'Refund Policy',
    question: 'Does Noretmy offer a money-back guarantee?',
    answer:
      'Noretmy offers a refund only if the freelancer abandons the project and does not respond within 14 days. The freelancer will be reported and banned from the platform.',
  },
  {
    category: 'General',
    question: 'Can I work on projects from anywhere in the world?',
    answer:
      'Noretmy is a global platform that allows freelancers and businesses to work from almost any location.',
  },
  {
    category: 'General',
    question:
      'Can I have both a client and freelancer account at the same time?',
    answer:
      'Yes, but you need to create each account with a different email address.',
  },
  {
    category: 'Intellectual Property',
    question: "What is Noretmy's intellectual property policy?",
    answer:
      'Intellectual property is governed by the terms agreed upon between the client and the freelancer for each project. Both parties should sign a contract (NDA) if the project is confidential or requires copyright protection.',
  },
  {
    category: 'Intellectual Property',
    question: 'How is my intellectual property protected as a client?',
    answer:
      'You should agree on intellectual property terms in a contract (NDA) with the freelancer. If a freelancer violates these terms, they will be reported and removed from the platform, and you will receive a refund to hire another freelancer.',
  },
  {
    category: 'Project Management',
    question: 'What happens if a freelancer abandons my project?',
    answer:
      'If a freelancer abandons the project without notifying the client, after 14 business days, the client will be entitled to a refund in their Noretmy balance to hire another freelancer. The freelancer will also be reported on the platform.',
  },
  {
    category: 'Project Management',
    question: 'Can I change the terms of a project once it has started?',
    answer:
      'Changes in project terms must be mutually agreed upon between the freelancer and the client. If an extension is required, a new offer must be made with the necessary adjustments.',
  },
  {
    category: 'Project Management',
    question:
      'What if my project becomes more complex and I need to add something?',
    answer:
      'You can communicate with the freelancer to discuss adjustments. If additional work is required, you will need to submit a new offer with an updated budget.',
  },
  {
    category: 'Project Management',
    question: 'Can I cancel a project?',
    answer:
      'Once the freelancer has sent you the offer and payment has been made, you will no longer be able to cancel the order.',
  },
  {
    category: 'Quality Standards',
    question: 'What are the benefits of verifying my identity on Noretmy?',
    answer: 'Identity verification can increase trust between users.',
  },
  {
    category: 'Quality Standards',
    question: 'How are freelancers rated on Noretmy?',
    answer:
      'Freelancers are rated by clients based on their performance in projects. Clients can leave reviews and comments once a freelancer marks a job as completed.',
  },
  {
    category: 'Quality Standards',
    question: 'How are projects rated on Noretmy?',
    answer:
      "Projects can be rated through reviews and comments. Users can see all ratings and comments on freelancers' profiles.",
  },
  {
    category: 'Quality Standards',
    question: 'What is Noretmy’s policy on inappropriate content?',
    answer:
      'Publishing inappropriate content is strictly prohibited. Users violating this policy will be reported and removed from the platform.',
  },
  {
    category: 'Support',
    question: 'What is the average response time for support inquiries?',
    answer: 'We aim to respond within 24 to 72 hours.',
  },
  {
    category: 'Account & Profile',
    question: 'How can I close my account?',
    answer:
      'To close your account, go to your profile settings and follow the instructions for account deactivation.',
  },
  {
    category: 'Clients',
    question: 'Does Noretmy offer training for clients?',
    answer:
      'Noretmy is a very intuitive platform designed to ensure the best experience and ease of use for clients.',
  },
  {
    category: 'Clients',
    question: 'Can I export my conversations and project data on Noretmy?',
    answer:
      'We do not offer the option to export conversations or project data.',
  },
  {
    category: 'Clients',
    question:
      'What happens if a client does not provide feedback after completing a project?',
    answer:
      'If a client does not provide feedback, the project is considered completed.',
  },
  {
    category: 'Clients',
    question: 'How do I create an offer on Noretmy?',
    answer:
      'You can see all the gig pricing on the platfrom. If you want milestone or custom order you may contact freelancer to create an offer.',
  },
  {
    category: 'Clients',
    question: 'How do I message a freelancer?',
    answer:
      'Select a freelancer and click on the chat button to access Noretmy’s internal chat system.',
  },
  {
    category: 'Clients',
    question: 'How can I view a freelancer’s profile?',
    answer:
      'You can click on the user profle picture to navigate to Freelncers profile.',
  },
  {
    category: 'Clients',
    question: 'What taxes do I have to pay on Noretmy?',
    answer:
      'The applicable VAT depends on the country from which the service is purchased, plus a 2% commission on each hired service.',
  },
  {
    category: 'Account & Profile',
    question: 'How can I edit my profile description or details?',
    answer:
      'You can edit your profile description and details by accessing your profile settings.',
  },
  {
    category: 'Support',
    question: 'How can I contact Noretmy support?',
    answer: 'You can contact support via our email: info@noretmy.com.',
  },
  {
    category: 'Privacy & Security',
    question: 'Does Noretmy have any age restrictions for users?',
    answer:
      'Users must be at least 18 years old to register and use the platform. Users aged 13 to 17 can use Noretmy with parental or legal guardian consent.',
  },
  {
    category: 'Clients',
    question: 'Can I add someone as a friend?',
    answer: 'ANSWER',
  },
  {
    category: 'Clients',
    question: 'Can I pay with my Noretmy balance?',
    answer: 'Yes, you can use your Noretmy balance to make payments.',
  },
  {
    category: 'Privacy & Security',
    question: 'Why can my account be closed?',
    answer:
      'Accounts may be closed for reasons such as posting inappropriate content, spamming, harassing or extorting users, paying for positive reviews, sending malicious links, fraud, identity theft, selling accounts, hacking reviews, chat, or video calls, and sharing personal contact details.',
  },
  {
    category: 'Account & Profile',
    question: 'Can I recover a deleted profile?',
    answer: 'Once a profile is deleted, it cannot be recovered.',
  },
  {
    category: 'Freelancer',
    question: 'Do I have to pay a monthly fee on Noretmy?',
    answer:
      'No, Noretmy only charges a commission when you make a sale and a client hires your services.',
  },
  {
    category: 'Freelancer',
    question: 'What happens if someone impersonates me as a freelancer?',
    answer: 'They will be reported and permanently removed from Noretmy.',
  },
  {
    category: 'Freelancer',
    question: 'How does Noretmy help increase sales?',
    answer:
      'We offer marketing tools such as discount coupons, content marketing, email marketing, social media promotion, SEO, social ads, and digital marketing. You can also promote your services with different paid plans for more visibility.',
  },
  {
    category: 'General',
    question: 'How can I receive emails from Noretmy?',
    answer:
      'Subscribe to our newsletter to receive promotions, relevant news, and interesting content.',
  },
  {
    category: 'General',
    question: 'What are the stars on Noretmy?',
    answer:
      "Stars represent user reviews of freelancers. Users can also leave comments and view a freelancer's project history.",
  },

  {
    category: 'Service Management',
    question: 'How do I publish a service?',
    answer: 'ANSWER',
  },
  {
    category: 'Service Management',
    question: 'How long does it take for my service to be published?',
    answer:
      'Once your service is approved, it will be published. The approval process takes between 24 and 72 hours.',
  },
  {
    category: 'Pricing & Fees',
    question: 'What is the currency conversion fee?',
    answer: 'The currency conversion fee is 3.50%.',
  },
  {
    category: 'Payments & Withdrawals',
    question: 'What is the withdrawal fee?',
    answer: 'The withdrawal fee is 3% + $0.35 USD.',
  },
  {
    category: 'Payments & Withdrawals',
    question: 'When can I withdraw my earnings?',
    answer:
      'Earnings can be withdrawn after 14 business days. The minimum withdrawal amount is $20.',
  },
];

const groupedFAQs = faqs.reduce(
  (acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  },
  {} as Record<string, FAQ[]>,
);

const FAQScreen: React.FC = () => {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(
    Object.keys(groupedFAQs)[0] || null,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCategory = (category: string) => {
    setActiveCategory(category);
    if (sectionRefs.current[category]) {
      sectionRefs.current[category]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAccordionChange = (value: string) => {
    if (expandedItems.includes(value)) {
      setExpandedItems(expandedItems.filter((item) => item !== value));
    } else {
      setExpandedItems([...expandedItems, value]);
    }
  };

  const expandCategory = (category: string) => {
    const categoryItems = filteredFAQs[category].map(
      (_, index) => `faq-${category}-${index}`,
    );
    setExpandedItems([...expandedItems, ...categoryItems]);
  };

  const collapseCategory = (category: string) => {
    const categoryItems = filteredFAQs[category].map(
      (_, index) => `faq-${category}-${index}`,
    );
    setExpandedItems(
      expandedItems.filter((item) => !categoryItems.includes(item)),
    );
  };

  const filteredFAQs =
    searchQuery.trim() === ''
      ? groupedFAQs
      : Object.entries(groupedFAQs).reduce(
        (acc, [category, categoryFaqs]) => {
          const filtered = categoryFaqs.filter(
            (faq) =>
              faq.question
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()),
          );
          if (filtered.length > 0) {
            acc[category] = filtered;
          }
          return acc;
        },
        {} as Record<string, FAQ[]>,
      );

  const totalFAQs = Object.values(filteredFAQs).reduce(
    (sum, items) => sum + items.length,
    0,
  );

  return (
    <div className="bg-gradient-to-b from-orange-50 via-white to-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12 relative">
          <span className="inline-block px-4 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium mb-3">
            Support Center
          </span>
          <h1 className="text-4xl font-bold mb-3 text-gray-900">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our products and services
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
            <Search
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500"
              size={20}
            />
          </div>
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600 flex justify-between items-center px-4">
              <span>
                Found {totalFAQs} {totalFAQs === 1 ? 'result' : 'results'} for "
                {searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-orange-600 hover:text-orange-800"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Quick Links Sidebar */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-6 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-6 py-5 bg-orange-600 text-white">
                <h3 className="text-lg font-semibold flex items-center">
                  <BookOpen size={18} className="mr-2" />
                  Categories
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {Object.keys(filteredFAQs).map((category) => (
                  <li key={`link-${category}`}>
                    <button
                      onClick={() => scrollToCategory(category)}
                      className={`w-full text-left px-6 py-4 font-medium transition-colors flex items-center justify-between group ${activeCategory === category
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-3 ${activeCategory === category
                            ? 'bg-orange-600'
                            : 'bg-gray-300'
                            }`}
                        />
                        {category}
                      </div>
                      <span
                        className={`text-sm ${activeCategory === category ? 'text-orange-500' : 'text-gray-400'}`}
                      >
                        {filteredFAQs[category].length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="p-4 bg-gray-50 border-t border-gray-100">
                <p className="text-sm text-gray-600 text-center">
                  Cn&apos;t find an answer?
                </p>
                <button className="w-full mt-2 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="flex-grow">
            {Object.keys(filteredFAQs).length === 0 ? (
              <div className="text-center py-16 px-8 bg-white rounded-xl shadow-md border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                  <Search size={24} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">
                  We couldn&apos;t find any FAQs matching "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-5 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(filteredFAQs).map(
                  ([category, categoryFaqs]) => (
                    <div
                      key={category}
                      ref={(el) => {
                        if (el) sectionRefs.current[category] = el;
                      }}
                      className="scroll-mt-6 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
                    >
                      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-white">
                        <h2 className="text-xl font-semibold text-gray-800">
                          {category}
                        </h2>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => expandCategory(category)}
                            className="p-1 text-gray-500 hover:text-orange-600 transition-colors"
                            aria-label="Expand all"
                            title="Expand all"
                          >
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={() => collapseCategory(category)}
                            className="p-1 text-gray-500 hover:text-orange-600 transition-colors"
                            aria-label="Collapse all"
                            title="Collapse all"
                          >
                            <Minus size={18} />
                          </button>
                        </div>
                      </div>

                      <Accordion
                        type="multiple"
                        value={expandedItems}
                        onValueChange={setExpandedItems}
                        className="divide-y divide-gray-100"
                      >
                        {categoryFaqs.map((faq, index) => {
                          const itemValue = `faq-${category}-${index}`;
                          const isExpanded = expandedItems.includes(itemValue);

                          return (
                            <AccordionItem
                              key={itemValue}
                              value={itemValue}
                              className="border-none"
                            >
                              <AccordionTrigger
                                onClick={() => handleAccordionChange(itemValue)}
                                className={`py-5 px-6 hover:bg-gray-50 text-left font-medium group ${isExpanded ? 'bg-orange-50' : ''}`}
                              >
                                <div className="flex items-start">
                                  <span className="mr-3 text-orange-600 font-semibold">
                                    Q:
                                  </span>
                                  <span
                                    className={
                                      isExpanded
                                        ? 'text-orange-700'
                                        : 'text-gray-800'
                                    }
                                  >
                                    {faq.question}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="py-5 px-6 pl-12 text-gray-600 bg-gray-50 border-t border-gray-100">
                                <div className="flex items-start">
                                  <span className="mr-3 text-orange-600 font-semibold">
                                    A:
                                  </span>
                                  <div>
                                    <p>{faq.answer}</p>
                                    {/* <div className="mt-4 flex items-center text-sm text-gray-500">
                                    <button className="text-orange-600 hover:underline mr-4 flex items-center">
                                      <span>Was this helpful?</span>
                                    </button>
                                  </div> */}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
          aria-label="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};

export default FAQScreen;
