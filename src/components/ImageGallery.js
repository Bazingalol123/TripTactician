import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-react';
import './ImageGallery.css';

const ImageGallery = ({ images = [] }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = (image, index) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (images.length > 0) {
      const nextIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(nextIndex);
      setSelectedImage(images[nextIndex]);
    }
  };

  const prevImage = () => {
    if (images.length > 0) {
      const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
      setCurrentIndex(prevIndex);
      setSelectedImage(images[prevIndex]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeModal();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      prevImage();
    }
  };

  if (!images || images.length === 0) {
    return (
      <motion.div 
        className="image-gallery empty"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Image className="placeholder-icon" />
        <p>No images available</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        className="image-gallery"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3>Destination Images</h3>
        <div className="gallery-grid">
          {images.slice(0, 4).map((image, index) => (
            <motion.div
              key={index}
              className="gallery-item"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openModal(image, index)}
            >
              <img
                src={image.url}
                alt={image.alt || `Destination image ${index + 1}`}
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="image-fallback">
                <Image className="fallback-icon" />
              </div>
            </motion.div>
          ))}
        </div>
        {images.length > 4 && (
          <p className="more-images">+{images.length - 4} more images</p>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="image-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={closeModal}>
                <X className="close-icon" />
              </button>
              
              {images.length > 1 && (
                <>
                  <button className="nav-btn prev" onClick={prevImage}>
                    <ChevronLeft className="nav-icon" />
                  </button>
                  <button className="nav-btn next" onClick={nextImage}>
                    <ChevronRight className="nav-icon" />
                  </button>
                </>
              )}

              <div className="modal-image-container">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt || 'Destination image'}
                  className="modal-image"
                />
              </div>

              <div className="modal-info">
                <p className="image-alt">{selectedImage.alt}</p>
                {selectedImage.photographer && (
                  <p className="photographer">
                    Photo by {selectedImage.photographer}
                  </p>
                )}
                <p className="image-counter">
                  {currentIndex + 1} of {images.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageGallery; 