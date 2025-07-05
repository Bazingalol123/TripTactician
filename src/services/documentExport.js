import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

class DocumentExportService {
  constructor() {
    this.defaultOptions = {
      format: 'a4',
      orientation: 'portrait',
      unit: 'mm',
      compress: true
    };
  }

  // Generate PDF from trip data
  async generateTripPDF(trip, options = {}) {
    const opts = { ...this.defaultOptions, ...options };
    
    try {
      const pdf = new jsPDF(opts.orientation, opts.unit, opts.format);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      
      let yPosition = margin;

      // Add header
      yPosition = await this.addPDFHeader(pdf, trip, yPosition, margin, contentWidth);
      
      // Add trip overview
      yPosition = await this.addTripOverview(pdf, trip, yPosition, margin, contentWidth);
      
      // Add daily itineraries
      if (trip.dailyItineraries && trip.dailyItineraries.length > 0) {
        for (let i = 0; i < trip.dailyItineraries.length; i++) {
          const day = trip.dailyItineraries[i];
          
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = margin;
          }
          
          yPosition = await this.addDayItinerary(pdf, day, yPosition, margin, contentWidth);
        }
      }
      
      // Add practical info
      if (trip.practicalInfo) {
        if (yPosition > pageHeight - 100) {
          pdf.addPage();
          yPosition = margin;
        }
        yPosition = await this.addPracticalInfo(pdf, trip.practicalInfo, yPosition, margin, contentWidth);
      }
      
      // Add footer
      this.addPDFFooter(pdf, trip);
      
      return pdf;
      
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  async addPDFHeader(pdf, trip, yPosition, margin, contentWidth) {
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text(trip.title || trip.destination || 'Trip Itinerary', margin, yPosition);
    yPosition += 15;
    
    // Destination and dates
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    
    if (trip.destination) {
      pdf.text(`📍 ${trip.destination}`, margin, yPosition);
      yPosition += 8;
    }
    
    if (trip.startDate && trip.endDate) {
      const startDate = new Date(trip.startDate).toLocaleDateString();
      const endDate = new Date(trip.endDate).toLocaleDateString();
      pdf.text(`📅 ${startDate} - ${endDate}`, margin, yPosition);
      yPosition += 8;
    }
    
    // Add separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, yPosition + 5, margin + contentWidth, yPosition + 5);
    yPosition += 15;
    
    return yPosition;
  }

  async addTripOverview(pdf, trip, yPosition, margin, contentWidth) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text('Trip Overview', margin, yPosition);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(102, 102, 102);
    
    const overview = [];
    
    if (trip.duration) {
      overview.push(`Duration: ${trip.duration} days`);
    }
    
    if (trip.estimatedCost) {
      overview.push(`Estimated Cost: $${trip.estimatedCost}`);
    }
    
    if (trip.dailyItineraries) {
      const totalActivities = trip.dailyItineraries.reduce((sum, day) => sum + (day.activities?.length || 0), 0);
      overview.push(`Total Activities: ${totalActivities}`);
    }
    
    if (trip.budget) {
      overview.push(`Budget Level: ${trip.budget}`);
    }
    
    overview.forEach(item => {
      pdf.text(`• ${item}`, margin + 5, yPosition);
      yPosition += 6;
    });
    
    yPosition += 10;
    return yPosition;
  }

  async addDayItinerary(pdf, day, yPosition, margin, contentWidth) {
    // Day header
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text(`Day ${day.day}${day.theme ? ` - ${day.theme}` : ''}`, margin, yPosition);
    yPosition += 8;
    
    if (day.date) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(102, 102, 102);
      pdf.text(new Date(day.date).toLocaleDateString(), margin, yPosition);
      yPosition += 8;
    }
    
    // Activities
    if (day.activities && day.activities.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      day.activities.forEach((activity, index) => {
        // Activity time and name
        pdf.setTextColor(51, 51, 51);
        const timeText = activity.time ? `${activity.time} - ` : '';
        pdf.text(`${timeText}${activity.name}`, margin + 10, yPosition);
        yPosition += 6;
        
        // Location
        if (activity.location) {
          pdf.setTextColor(128, 128, 128);
          pdf.text(`   📍 ${activity.location}`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        // Description
        if (activity.description) {
          pdf.setTextColor(102, 102, 102);
          const descLines = pdf.splitTextToSize(activity.description, contentWidth - 20);
          pdf.text(descLines, margin + 10, yPosition);
          yPosition += descLines.length * 4;
        }
        
        // Cost
        if (activity.cost) {
          pdf.setTextColor(76, 175, 80);
          pdf.text(`   💰 $${activity.cost}`, margin + 10, yPosition);
          yPosition += 5;
        }
        
        yPosition += 3;
      });
    }
    
    yPosition += 10;
    return yPosition;
  }

  async addPracticalInfo(pdf, practicalInfo, yPosition, margin, contentWidth) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 51, 51);
    pdf.text('Practical Information', margin, yPosition);
    yPosition += 12;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const sections = [
      { key: 'currency', label: 'Currency', icon: '💰' },
      { key: 'language', label: 'Language', icon: '🗣️' },
      { key: 'timeZone', label: 'Time Zone', icon: '🕐' },
      { key: 'bestTimeToVisit', label: 'Best Time to Visit', icon: '🌤️' },
      { key: 'transportation', label: 'Transportation', icon: '🚇' },
      { key: 'packing', label: 'Packing Tips', icon: '🎒' }
    ];
    
    sections.forEach(section => {
      if (practicalInfo[section.key]) {
        pdf.setTextColor(51, 51, 51);
        pdf.text(`${section.icon} ${section.label}:`, margin, yPosition);
        yPosition += 6;
        
        pdf.setTextColor(102, 102, 102);
        const text = typeof practicalInfo[section.key] === 'string' 
          ? practicalInfo[section.key] 
          : practicalInfo[section.key].join(', ');
        
        const lines = pdf.splitTextToSize(text, contentWidth - 10);
        pdf.text(lines, margin + 10, yPosition);
        yPosition += lines.length * 5 + 5;
      }
    });
    
    // Tips
    if (practicalInfo.tips && practicalInfo.tips.length > 0) {
      pdf.setTextColor(51, 51, 51);
      pdf.text('💡 Tips:', margin, yPosition);
      yPosition += 6;
      
      pdf.setTextColor(102, 102, 102);
      practicalInfo.tips.forEach(tip => {
        const lines = pdf.splitTextToSize(`• ${tip}`, contentWidth - 10);
        pdf.text(lines, margin + 10, yPosition);
        yPosition += lines.length * 5 + 2;
      });
    }
    
    return yPosition;
  }

  addPDFFooter(pdf, trip) {
    const pageCount = pdf.internal.getNumberOfPages();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(
        `Generated by Trip Tactician Pro • ${new Date().toLocaleDateString()}`,
        20,
        pageHeight - 10
      );
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdf.internal.pageSize.getWidth() - 40,
        pageHeight - 10
      );
    }
  }

  // Download PDF
  async downloadTripPDF(trip, filename) {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-generation' });
      
      const pdf = await this.generateTripPDF(trip);
      const pdfFilename = filename || `${trip.destination || 'trip'}-itinerary.pdf`;
      
      pdf.save(pdfFilename);
      
      toast.success('PDF downloaded successfully!', { id: 'pdf-generation' });
      return true;
      
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to generate PDF', { id: 'pdf-generation' });
      return false;
    }
  }

  // Generate JSON export
  exportTripJSON(trip, filename) {
    try {
      const tripData = {
        ...trip,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Trip Tactician Pro'
      };
      
      const dataStr = JSON.stringify(tripData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `${trip.destination || 'trip'}-data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Trip data exported successfully!');
      return true;
      
    } catch (error) {
      console.error('JSON export error:', error);
      toast.error('Failed to export trip data');
      return false;
    }
  }

  // Generate sharing link
  generateSharingLink(trip) {
    try {
      const shareData = {
        title: trip.title || `Trip to ${trip.destination}`,
        text: `Check out this amazing trip itinerary to ${trip.destination}!`,
        url: window.location.href
      };
      
      if (navigator.share) {
        return navigator.share(shareData);
      } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard!');
        return Promise.resolve();
      }
    } catch (error) {
      console.error('Sharing error:', error);
      toast.error('Failed to share trip');
      return Promise.reject(error);
    }
  }

  // Capture screenshot of itinerary
  async captureItineraryScreenshot(elementId, filename) {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }
      
      toast.loading('Capturing screenshot...', { id: 'screenshot' });
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      const link = document.createElement('a');
      link.download = filename || 'trip-itinerary.png';
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Screenshot saved!', { id: 'screenshot' });
      return true;
      
    } catch (error) {
      console.error('Screenshot error:', error);
      toast.error('Failed to capture screenshot', { id: 'screenshot' });
      return false;
    }
  }
}

// Export singleton instance
export const documentExport = new DocumentExportService();
export default DocumentExportService; 