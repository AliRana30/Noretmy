import React, { useState, useEffect } from 'react';
import { getFaqCategories, getFaqsByCategory } from '../../utils/adminApi';
import { PublicFaqViewer } from '../../components/faq';

const AddNewFaq = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getFaqCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Failed to load FAQ categories');
      }
    };
    loadCategories();
  }, []);

  // Load FAQs when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadFaqs(selectedCategory);
    } else {
      setFaqs([]);
    }
  }, [selectedCategory]);

  const loadFaqs = async (category) => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFaqsByCategory(category, true); // Only active FAQs
      setFaqs(response.data || []);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setError('Failed to load FAQs for this category');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  return (
    <div className="single">
      <div className="singleContainer">
        
        <div className="top">
          <div className="left">
            <h1 className="title">Frequently Asked Questions</h1>
            <p className="subtitle">Find answers to common questions about our platform</p>
          </div>
        </div>

        <div className="bottom">
          <PublicFaqViewer 
            categories={categories}
            selectedCategory={selectedCategory}
            faqs={faqs}
            loading={loading}
            error={error}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>
    </div>
  );
};

export default AddNewFaq;
