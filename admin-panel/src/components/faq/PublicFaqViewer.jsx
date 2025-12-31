import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip, 
  Divider, 
  Alert, 
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { getCategoryDisplayName } from '../../utils/adminApi';

const PublicFaqViewer = ({ 
  categories, 
  selectedCategory, 
  faqs, 
  loading, 
  error, 
  onCategoryChange 
}) => {
  return (
    <Card sx={{ 
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      border: '1px solid #e9ecef',
      overflow: 'hidden'
    }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 700, color: '#2d3748' }}>
            Select Category
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Choose a category to view FAQs</InputLabel>
            <Select
              value={selectedCategory}
              onChange={onCategoryChange}
              label="Choose a category to view FAQs"
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  '&:hover': {
                    borderColor: '#667eea',
                  },
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#667eea',
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value="">
                <em>Choose a category to view FAQs</em>
              </MenuItem>
              {categories.map(category => (
                <MenuItem key={category.value} value={category.value}>
                  {category.display}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress size={40} sx={{ color: '#667eea' }} />
          </Box>
        )}

        {!loading && selectedCategory && faqs.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No FAQs found for this category.
          </Alert>
        )}

        {!loading && faqs.length > 0 && (
          <Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 3,
              p: 2,
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              borderRadius: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                {categories.find(cat => cat.value === selectedCategory)?.display}
              </Typography>
              <Chip 
                label={`${faqs.length} FAQ(s)`}
                color="primary"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Box>
            
            {faqs.map((faq, index) => (
              <Accordion 
                key={faq.id} 
                sx={{ 
                  mb: 2,
                  borderRadius: 2,
                  '&:before': {
                    display: 'none',
                  },
                  '& .MuiAccordionSummary-root': {
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                  },
                  '& .MuiAccordionDetails-root': {
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 0 8px 8px',
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#667eea' }} />}
                  aria-controls={`faq-content-${index}`}
                  id={`faq-header-${index}`}
                  sx={{ px: 3, py: 2 }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2d3748' }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, py: 3 }}>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    {faq.answer}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={faq.categoryDisplay || getCategoryDisplayName(faq.category)}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ borderRadius: 1.5 }}
                    />
                    {faq.order > 0 && (
                      <Chip 
                        label={`Order: ${faq.order}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 1.5 }}
                      />
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {!selectedCategory && !loading && (
          <Box textAlign="center" py={6}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}>
              <ExpandMoreIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Select a category above to view FAQs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              We have organized our FAQs into categories to help you find the information you need quickly.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PublicFaqViewer;
