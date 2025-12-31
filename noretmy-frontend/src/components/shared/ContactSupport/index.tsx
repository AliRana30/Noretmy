// // "use client"
// // "use client"
// // import React, { useState } from 'react';
// // import { AlertCircle, CheckCircle, Send, Mail, User, HelpCircle } from 'lucide-react';
// // import axios from 'axios';

// // const ContactSupport: React.FC = () => {
// //     const [formData, setFormData] = useState({
// //         name: '',
// //         email: '',
// //         subject: '',
// //         message: '',
// //     });
// //     const [errors, setErrors] = useState<Record<string, string>>({});
// //     const [isSubmitting, setIsSubmitting] = useState(false);
// //     const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

// //     const validateForm = () => {
// //         const newErrors: Record<string, string> = {};

// //         if (!formData.name.trim()) newErrors.name = 'Name is required';
// //         if (!formData.email.trim()) newErrors.email = 'Email is required';
// //         else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
// //         if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
// //         if (!formData.message.trim()) newErrors.message = 'Message is required';

// //         setErrors(newErrors);
// //         return Object.keys(newErrors).length === 0;
// //     };

// //     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
// //         const { name, value } = e.target;
// //         setFormData(prev => ({ ...prev, [name]: value }));

// //         // Clear error when user starts typing
// //         if (errors[name]) {
// //             setErrors(prev => ({ ...prev, [name]: '' }));
// //         }
// //     };

// //     const handleSubmit = async (e: React.FormEvent) => {
// //         console.log("Here is submit form")
// //         e.preventDefault();

// //         if (!validateForm()) return;

// //         setIsSubmitting(true);
// //         setSubmitStatus('idle');

// //         try {
// //             // Simulate API call
// //             // await new Promise(resolve => setTimeout(resolve, 1500));

// //             // In a real application, you would send the data to your API
// //             // const response = await fetch('/api/contact', {
// //             //   method: 'POST',
// //             //   headers: { 'Content-Type': 'application/json' },
// //             //   body: JSON.stringify(formData)
// //             // });
// //             await axios.post("https://api.noretmy.com/api/contact", formData, {
// //                 withCredentials: true,
// //                 headers: { 'Content-Type': 'application/json' },
// //             });

// //             console.log("Form data",formData)
// //             setSubmitStatus('success');
// //             setFormData({ name: '', email: '', subject: '', message: '' });
// //         } catch (error) {
// //             setSubmitStatus('error');
// //         } finally {
// //             setIsSubmitting(false);
// //         }
// //     };

// //     return (
// //         <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
// //             <div className="bg-gradient-to-r from-indigo-600 to-blue-500 p-8 text-white">
// //                 <h2 className="text-3xl font-bold tracking-tight">Contact Support</h2>
// //                 <p className="mt-3 text-indigo-100 text-lg">We're here to help! Our team will respond within 24 hours.</p>
// //             </div>

// //             {submitStatus === 'success' ? (
// //                 <div className="p-12 text-center">
// //                     <div className="flex justify-center mb-6">
// //                         <div className="bg-green-100 p-4 rounded-full">
// //                             <CheckCircle className="h-16 w-16 text-green-600" />
// //                         </div>
// //                     </div>
// //                     <h3 className="text-2xl font-semibold text-gray-800 mb-3">Thank You!</h3>
// //                     <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">Your message has been sent successfully. We'll get back to you as soon as possible.</p>
// //                     <button
// //                         onClick={() => setSubmitStatus('idle')}
// //                         className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
// //                     >
// //                         Send Another Message
// //                     </button>
// //                 </div>
// //             ) : (
// //                 <form onSubmit={handleSubmit} className="p-8 space-y-6">
// //                     {submitStatus === 'error' && (
// //                         <div className="bg-red-50 p-4 rounded-lg flex items-start space-x-3 text-red-800 border border-red-200">
// //                             <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
// //                             <div>
// //                                 <h4 className="font-medium">Error submitting form</h4>
// //                                 <p className="text-sm text-red-700 mt-1">Please try again later or contact us directly.</p>
// //                             </div>
// //                         </div>
// //                     )}

// //                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //                         <div className="space-y-2">
// //                             <label htmlFor="name" className="block text-sm font-medium text-gray-700">
// //                                 Name
// //                             </label>
// //                             <div className="relative">
// //                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
// //                                     <User className="h-5 w-5 text-gray-400" />
// //                                 </div>
// //                                 <input
// //                                     type="text"
// //                                     id="name"
// //                                     name="name"
// //                                     value={formData.name}
// //                                     onChange={handleChange}
// //                                     className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.name ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
// //                                         }`}
// //                                     placeholder="Your name"
// //                                 />
// //                             </div>
// //                             {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
// //                         </div>

// //                         <div className="space-y-2">
// //                             <label htmlFor="email" className="block text-sm font-medium text-gray-700">
// //                                 Email
// //                             </label>
// //                             <div className="relative">
// //                                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
// //                                     <Mail className="h-5 w-5 text-gray-400" />
// //                                 </div>
// //                                 <input
// //                                     type="email"
// //                                     id="email"
// //                                     name="email"
// //                                     value={formData.email}
// //                                     onChange={handleChange}
// //                                     className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.email ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
// //                                         }`}
// //                                     placeholder="your.email@example.com"
// //                                 />
// //                             </div>
// //                             {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
// //                         </div>
// //                     </div>

// //                     <div className="space-y-2">
// //                         <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
// //                             Subject
// //                         </label>
// //                         <div className="relative">
// //                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
// //                                 <HelpCircle className="h-5 w-5 text-gray-400" />
// //                             </div>
// //                             <select
// //                                 id="subject"
// //                                 name="subject"
// //                                 value={formData.subject}
// //                                 onChange={handleChange}
// //                                 className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white transition-colors ${errors.subject ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
// //                                     }`}
// //                             >
// //                                 <option value="">Select a subject</option>
// //                                 <option value="Technical Issue">Technical Issue</option>
// //                                 <option value="Billing Question">Billing Question</option>
// //                                 <option value="Account Help">Account Help</option>
// //                                 <option value="Feature Request">Feature Request</option>
// //                                 <option value="Other">Other</option>
// //                             </select>
// //                             <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
// //                                 <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                                     <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
// //                                 </svg>
// //                             </div>
// //                         </div>
// //                         {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject}</p>}
// //                     </div>

// //                     <div className="space-y-2">
// //                         <label htmlFor="message" className="block text-sm font-medium text-gray-700">
// //                             Message
// //                         </label>
// //                         <textarea
// //                             id="message"
// //                             name="message"
// //                             rows={6}
// //                             value={formData.message}
// //                             onChange={handleChange}
// //                             className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors ${errors.message ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
// //                                 }`}
// //                             placeholder="Please describe your issue or question in detail..."
// //                         ></textarea>
// //                         {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
// //                     </div>

// //                     <div className="flex justify-end pt-2">
// //                         <button
// //                             type="submit"
// //                             disabled={isSubmitting}
// //                             className={`px-8 py-3 rounded-lg flex items-center space-x-2 ${isSubmitting
// //                                     ? 'bg-indigo-400 cursor-not-allowed'
// //                                     : 'bg-indigo-600 hover:bg-indigo-700'
// //                                 } text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-md font-medium`}
// //                         >
// //                             {isSubmitting ? (
// //                                 <>
// //                                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
// //                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
// //                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
// //                                     </svg>
// //                                     <span>Sending...</span>
// //                                 </>
// //                             ) : (
// //                                 <>
// //                                     <Send className="h-5 w-5" />
// //                                     <span>Send Message</span>
// //                                 </>
// //                             )}
// //                         </button>
// //                     </div>
// //                 </form>
// //             )}

// //             <div className="bg-gray-50 p-6 border-t border-gray-100">
// //                 <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
// //                     <div className="text-gray-600 text-sm flex items-center">
// //                         <svg className="h-5 w-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
// //                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
// //                         </svg>
// //                         Average response time: <span className="font-medium ml-1">24 hours</span>
// //                     </div>
// //                     <div className="flex space-x-6">
// //                         <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">FAQ</a>
// //                         {/* <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">Knowledge Base</a> */}
// //                         {/* <a href="#" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">Live Chat</a> */}
// //                     </div>
// //                 </div>
// //             </div>
// //         </div>
// //     );
// // };

// // export default ContactSupport;

// 'use client';
// import React, { useState } from 'react';
// import {
//   Clock,
//   CheckCircle,
//   XCircle,
//   ChevronDown,
//   ChevronUp,
//   Search,
// } from 'lucide-react';

// // Define TypeScript interfaces for our data
// interface Message {
//   _id: string;
//   email: string;
//   message: string;
//   userId: string;
//   isReplied: boolean;
//   createdAt: string;
//   updatedAt: string;
//   __v: number;
// }

// const UserMessages: React.FC = () => {
//   // Sample data from your JSON (in a real app, this would come from an API)
//   const messagesData: Message[] = [
//     {
//       _id: '66cd285f439bb8f54e3af87e',
//       email: 'waleedahmad8570@gmail.com',
//       message: '2nd test message',
//       userId: '66c136ab03ab47b950d0f289',
//       isReplied: false,
//       createdAt: '2024-08-27T01:14:07.940Z',
//       updatedAt: '2024-08-27T01:14:07.940Z',
//       __v: 0,
//     },
//     {
//       _id: '66cd2866439bb8f54e3af880',
//       email: 'waleedahmad8570@gmail.com',
//       message: '3rd test message',
//       userId: '66c136ab03ab47b950d0f289',
//       isReplied: false,
//       createdAt: '2024-08-27T01:14:14.774Z',
//       updatedAt: '2024-08-27T01:14:14.774Z',
//       __v: 0,
//     },
//     {
//       _id: '66cd2852439bb8f54e3af87c',
//       email: 'waleedahmad8570@gmail.com',
//       message: 'First test message',
//       userId: '66c136ab03ab47b950d0f289',
//       isReplied: false,
//       createdAt: '2024-08-27T01:13:54.467Z',
//       updatedAt: '2024-08-27T01:13:54.467Z',
//       __v: 0,
//     },
//     {
//       _id: '66cd2610e9e28ebf3a1fa739',
//       email: 'waleedahmad8570@gmail.com',
//       message:
//         'is Replied Abc from Waleed We have solved the issue that you were getting. You will have to wait 90 days to get your funds cleared.Thank you',
//       userId: '66c136ab03ab47b950d0f289',
//       isReplied: true,
//       createdAt: '2024-08-27T01:04:16.034Z',
//       updatedAt: '2024-08-28T16:45:04.043Z',
//       __v: 0,
//     },
//     {
//       _id: '66cd286c439bb8f54e3af882',
//       email: 'waleedahmad8570@gmail.com',
//       message: '4th test message',
//       userId: '66c136ab03ab47b950d0f289',
//       isReplied: true,
//       createdAt: '2024-08-27T01:14:20.823Z',
//       updatedAt: '2024-08-27T01:21:13.304Z',
//       __v: 0,
//     },
//   ];

//   // State for filters and search
//   const [filter, setFilter] = useState<'all' | 'replied' | 'not-replied'>(
//     'all',
//   );
//   const [searchTerm, setSearchTerm] = useState('');
//   const [expandedMessageId, setExpandedMessageId] = useState<string | null>(
//     null,
//   );
//   const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

//   // Filter and sort messages
//   const filteredMessages = messagesData
//     .filter((message) => {
//       // Apply status filter
//       if (filter === 'replied') return message.isReplied;
//       if (filter === 'not-replied') return !message.isReplied;
//       return true;
//     })
//     .filter((message) => {
//       // Apply search filter (case insensitive)
//       return (
//         message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         message.email.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     })
//     .sort((a, b) => {
//       // Sort by date
//       const dateA = new Date(a.createdAt).getTime();
//       const dateB = new Date(b.createdAt).getTime();
//       return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
//     });

//   // Format date function
//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   // Toggle message expansion
//   const toggleMessageExpansion = (id: string) => {
//     if (expandedMessageId === id) {
//       setExpandedMessageId(null);
//     } else {
//       setExpandedMessageId(id);
//     }
//   };

//   return (
//     <div className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
//       <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
//         <h2 className="text-2xl font-bold">Your Messages</h2>
//         <p className="mt-2 text-purple-100">
//           View and manage your communication history
//         </p>
//       </div>

//       {/* Filters and Search */}
//       <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between gap-4">
//         <div className="flex space-x-2">
//           <button
//             onClick={() => setFilter('all')}
//             className={`px-4 py-2 rounded-md text-sm font-medium ${
//               filter === 'all'
//                 ? 'bg-indigo-600 text-white'
//                 : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             All Messages
//           </button>
//           <button
//             onClick={() => setFilter('replied')}
//             className={`px-4 py-2 rounded-md text-sm font-medium ${
//               filter === 'replied'
//                 ? 'bg-indigo-600 text-white'
//                 : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             Replied
//           </button>
//           <button
//             onClick={() => setFilter('not-replied')}
//             className={`px-4 py-2 rounded-md text-sm font-medium ${
//               filter === 'not-replied'
//                 ? 'bg-indigo-600 text-white'
//                 : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//             }`}
//           >
//             Not Replied
//           </button>
//         </div>

//         <div className="flex items-center space-x-4">
//           <div className="relative">
//             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//               <Search className="h-4 w-4 text-gray-400" />
//             </div>
//             <input
//               type="text"
//               placeholder="Search messages..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 w-full"
//             />
//           </div>

//           <button
//             onClick={() =>
//               setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')
//             }
//             className="flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 text-sm"
//           >
//             {sortOrder === 'newest' ? (
//               <>
//                 <ChevronDown className="h-4 w-4 mr-1" /> Newest
//               </>
//             ) : (
//               <>
//                 <ChevronUp className="h-4 w-4 mr-1" /> Oldest
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Messages List */}
//       <div className="divide-y divide-gray-200">
//         {filteredMessages.length > 0 ? (
//           filteredMessages.map((message) => (
//             <div
//               key={message._id}
//               className="p-6 hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex justify-between items-start">
//                 <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
//                   <div className="flex items-center">
//                     <div
//                       className={`w-3 h-3 rounded-full mr-3 ${message.isReplied ? 'bg-green-500' : 'bg-yellow-500'}`}
//                     ></div>
//                     <span className="font-medium">{message.email}</span>
//                   </div>
//                   <div className="flex items-center text-sm text-gray-500">
//                     <Clock className="h-4 w-4 mr-1" />
//                     {formatDate(message.createdAt)}
//                   </div>
//                 </div>
//                 <div className="flex items-center">
//                   {message.isReplied ? (
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
//                       <CheckCircle className="h-3 w-3 mr-1" />
//                       Replied
//                     </span>
//                   ) : (
//                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
//                       <XCircle className="h-3 w-3 mr-1" />
//                       Pending
//                     </span>
//                   )}
//                   <button
//                     onClick={() => toggleMessageExpansion(message._id)}
//                     className="text-gray-400 hover:text-gray-600"
//                   >
//                     {expandedMessageId === message._id ? (
//                       <ChevronUp className="h-5 w-5" />
//                     ) : (
//                       <ChevronDown className="h-5 w-5" />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Subject line (first 60 chars of message) */}
//               <div className="mt-2 text-gray-600 font-medium">
//                 {message.message.length > 60
//                   ? `${message.message.substring(0, 60)}...`
//                   : message.message}
//               </div>

//               {/* Expanded message content */}
//               {expandedMessageId === message._id && (
//                 <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
//                   <p className="text-gray-700 whitespace-pre-wrap">
//                     {message.message}
//                   </p>

//                   {message.isReplied && (
//                     <div className="mt-4 pt-4 border-t border-gray-200">
//                       <div className="flex items-center">
//                         <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
//                         <span className="text-sm font-medium text-gray-700">
//                           Replied on {formatDate(message.updatedAt)}
//                         </span>
//                       </div>
//                       {/* Here you could add the reply content if it exists in your data */}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           ))
//         ) : (
//           <div className="py-12 text-center text-gray-500">
//             <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
//               <Search className="h-8 w-8 text-gray-400" />
//             </div>
//             <p className="text-lg font-medium">No messages found</p>
//             <p className="mt-1">Try adjusting your search or filter criteria</p>
//           </div>
//         )}
//       </div>

//       {/* Footer with stats */}
//       <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-600">
//         <div>Total Messages: {messagesData.length}</div>
//         <div className="flex space-x-4">
//           <div>Replied: {messagesData.filter((m) => m.isReplied).length}</div>
//           <div>Pending: {messagesData.filter((m) => !m.isReplied).length}</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserMessages;




