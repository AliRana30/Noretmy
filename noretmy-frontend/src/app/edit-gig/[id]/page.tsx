'use client';

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FaSave,  FaImage, FaPlus, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { selectGigById } from '@/store/gigSlice';
import { useSelector } from 'react-redux';

interface Gig {
  _id: string;
  title: string;
  cat: string;
  description: string;
  keywords: string[];
  whyChooseMe: string;
  discount: number;
  faqs: Array<{ question: string; answer: string }>;
  jobStatus: string;
  photos: string[];
  upgradeOption: string;
  sellerId: string;
  totalStars: number;
  starNumber: number;
  sales: number;
  payment_intent: string;
  createdAt: string;
  updatedAt: string;
}

interface EditGigProps {
  params: {
    id: string;
  };
}

// Available categories
const CATEGORIES = [
  'Digital Marketing',
  'Web Development',
  'Graphic Design',
  'Content Writing',
  'Video Editing',
  'SEO',
  'Social Media',
  'Voice Over',
  'Translation',
  'Other'
];

// Job status options
const JOB_STATUS = ['Available', 'Unavailable'
];

const EditGig: React.FC<EditGigProps> = ({ params }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  
  const [gig, setGig] = useState<Gig | null>(null);

  const gigfro = useSelector((state) => selectGigById(state, params.id));

  console.log(gig);

  
  const [formData, setFormData] = useState({
    title: '',
    cat: '',
    description: '',
    keywords: [] as string[],
    whyChooseMe: '',
    discount: 0,
    faqs: [] as Array<{ question: string; answer: string }>,
    jobStatus: 'Available',
    photos: [] as string[],
    payment_intent: ''
  });

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
  
  useEffect(() => {
    const fetchGig = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/job/single/${params.id}`, {
          withCredentials: true,
        });
        
        const gigData = response.data.gig;
        setGig(gigData);
        
        setFormData({
          title: gigData.title || '',
          cat: gigData.cat || '',
          description: gigData.description || '',
          keywords: gigData.keywords || [],
          whyChooseMe: gigData.whyChooseMe || '',
          discount: gigData.discount || 0,
          faqs: gigData.faqs || [],
          jobStatus: gigData.jobStatus || 'Available',
          photos: gigData.photos || [],
          payment_intent: gigData.payment_intent || ''
        });
      } catch (error) {
        console.error('Error fetching gig:', error);
        toast.error('Failed to load gig details');
        // router.push('/gigs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGig();
  }, [params.id, BASE_URL, router]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'discount' ? Number(value) : value
    }));
  };
  
  const handleAddKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };
  
  const handleRemoveKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };
  
  const handleAddFaq = () => {
    if (newFaq.question.trim() && newFaq.answer.trim()) {
      setFormData(prev => ({
        ...prev,
        faqs: [...prev.faqs, { ...newFaq }]
      }));
      setNewFaq({ question: '', answer: '' });
    }
  };
  
  const handleRemoveFaq = (index: number) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('image', files[0]);
      
      const response = await axios.post(`${BASE_URL}/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const imageUrl = response.data.url;
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, imageUrl]
      }));
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const handleRemoveImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo !== url)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    
    if (!formData.cat) {
      toast.error('Category is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    
    if (formData.photos.length === 0) {
      toast.error('At least one image is required');
      return;
    }
    
    try {
      setSaving(true);
      
      await axios.put(`${BASE_URL}/job/${params.id}`, formData, {
        withCredentials: true,
      });
      
      toast.success('Gig updated successfully');

    //   setTimeout(() => {
    //     router.push('/gigs');
    //   }, 1500);
    } catch (error) {
      console.error('Error updating gig:', error);
      toast.error('Failed to update gig');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  if (!gig) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Gig not found</h2>
        {/* <button
          onClick={() => router.push('/gigs')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Back to Gigs
        </button> */}
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* <button
            onClick={() => router.push('/gigs')}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft size={18} />
          </button> */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Edit <span className="text-orange-600">Gig</span>
          </h1>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={saving}
          className={`${
            saving ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
          } text-white px-5 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md`}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
          ) : (
            <FaSave size={16} />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title*
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter gig title"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="cat" className="block text-sm font-medium text-gray-700 mb-1">
                  Category*
                </label>
                <select
                  id="cat"
                  name="cat"
                  value={formData.cat}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="jobStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="jobStatus"
                  name="jobStatus"
                  value={formData.jobStatus}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                >
                  {JOB_STATUS.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="discount" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount (%)
                </label>
                <input
                  type="number"
                  id="discount"
                  name="discount"
                  value={formData.discount}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                  placeholder="Enter discount percentage"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description*
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Describe your service in detail"
                required
              />
            </div>
            
            <div>
              <label htmlFor="whyChooseMe" className="block text-sm font-medium text-gray-700 mb-1">
                Why Choose Me
              </label>
              <textarea
                id="whyChooseMe"
                name="whyChooseMe"
                value={formData.whyChooseMe}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="List reasons why clients should choose your services"
              />
            </div>
          </div>
          
          {/* Keywords/Tags */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Keywords/Tags</h2>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.keywords.map(keyword => (
                <div 
                  key={keyword} 
                  className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <span>{keyword}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="text-orange-700 hover:text-orange-900"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Add a keyword"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
          
          {/* FAQs */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">FAQs</h2>
            
            {formData.faqs.length > 0 && (
              <div className="space-y-4">
                {formData.faqs.map((faq, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(index)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    >
                      <FaTimes size={16} />
                    </button>
                    <h3 className="font-medium text-gray-800 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
            
            <div className="space-y-3">
              <input
                type="text"
                value={newFaq.question}
                onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Question"
              />
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                placeholder="Answer"
              />
              <button
                type="button"
                onClick={handleAddFaq}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <FaPlus size={14} />
                <span>Add FAQ</span>
              </button>
            </div>
          </div>
          
          {/* Images */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Images</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden aspect-square">
                  <img 
                    src={photo} 
                    alt={`Gig image ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(photo)}
                      className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                    >
                      <FaTimes size={16} />
                    </button>
                  </div>
                </div>
              ))}
              
              {formData.photos.length < 5 && (
                <label className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors aspect-square">
                  <div className="flex flex-col items-center justify-center p-4">
                    <FaImage className="text-gray-400 text-3xl mb-2" />
                    <span className="text-gray-500 text-sm text-center">
                      {uploadingImage ? 'Uploading...' : 'Add Image'}
                    </span>
                  </div>
                  <input
                    type="file"
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>
            
            <p className="text-sm text-gray-500">
              Add up to 5 images. First image will be used as the cover.
            </p>
          </div>
          
          {/* Payment information - readonly */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">Payment Information</h2>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Intent</p>
                  <p className="font-medium">{gig.payment_intent}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sales</p>
                  <p className="font-medium">{gig.sales}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">{gig.starNumber > 0 ? `${gig.totalStars / gig.starNumber} (${gig.starNumber} reviews)` : 'No ratings yet'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{new Date(gig.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGig;