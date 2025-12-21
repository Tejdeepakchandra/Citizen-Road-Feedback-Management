import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Card,
  CardMedia,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Visibility,
  Close,
  AddPhotoAlternate,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const ImageUploader = ({
  onUpload,
  maxFiles = 5,
  accept = 'image/*',
  value = [],
  readOnly = false,
}) => {
  const [images, setImages] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  const theme = useTheme();

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + images.length > maxFiles) {
      alert(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const newImages = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
    }));

    setImages(prev => [...prev, ...newImages]);
    
    // Simulate upload progress
    setUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setUploadProgress(0);
        if (onUpload) {
          onUpload([...images, ...newImages]);
        }
      }
    }, 100);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (onUpload) {
      onUpload(newImages);
    }
  };

  const handlePreview = (image) => {
    setPreviewImage(image);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length) {
      const event = {
        target: { files: files }
      };
      handleFileSelect(event);
    }
  };

  if (readOnly && images.length === 0) {
    return null;
  }

  return (
    <Box>
      {/* Upload Area */}
      {!readOnly && (
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Box
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: theme.palette.background.default,
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.primary.main + '08',
              },
              mb: 3,
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            
            <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Drag & drop images here
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              or click to browse files
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddPhotoAlternate />}
              sx={{ mt: 1 }}
            >
              Select Images
            </Button>
            
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              Supports JPG, PNG, GIF up to 5MB each
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Maximum {maxFiles} images ({images.length}/{maxFiles} used)
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Uploading images...
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={uploadProgress} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Uploaded Images ({images.length})
          </Typography>
          <Grid container spacing={2}>
            <AnimatePresence>
              {images.map((image, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: 2,
                        '&:hover .image-overlay': {
                          opacity: 1,
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="140"
                        image={image.url}
                        alt={image.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      
                      {/* Overlay Actions */}
                      <Box
                        className="image-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handlePreview(image)}
                          sx={{ color: '#fff' }}
                        >
                          <Visibility />
                        </IconButton>
                        {!readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(index)}
                            sx={{ color: '#fff' }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                      
                      {/* Image Info */}
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          p: 1,
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#fff', display: 'block' }}>
                          {image.name.length > 20 
                            ? `${image.name.substring(0, 20)}...` 
                            : image.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#fff', opacity: 0.8 }}>
                          {formatFileSize(image.size)}
                        </Typography>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        </Box>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
          onClick={() => setPreviewImage(null)}
        >
          <IconButton
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              color: '#fff',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
          >
            <Close />
          </IconButton>
          
          <Box
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage.url}
              alt={previewImage.name}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 8,
              }}
            />
            
            <Box sx={{ mt: 2, color: '#fff' }}>
              <Typography variant="h6">{previewImage.name}</Typography>
              <Typography variant="body2">
                Size: {formatFileSize(previewImage.size)} • Type: {previewImage.type}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploader;