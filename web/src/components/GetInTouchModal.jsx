import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconMail, IconUser, IconBriefcase, IconSend } from '@tabler/icons-react';
import PhoneInput from 'react-phone-number-input';
import emailjs from '@emailjs/browser';
import toast, { Toaster } from 'react-hot-toast';
import { emailJsConfig } from '@/config/emailjs.config';
import { submitToGoogleSheets } from '@/config/googlesheets.config';
import 'react-phone-number-input/style.css';
import '@/styles/phone-input.css';

const GetInTouchModal = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    delegation: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Prevent duplicate submissions

  // Use external control if provided, otherwise use internal timer logic
  const modalIsOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen;

  useEffect(() => {
    // Only show timer-based modal if no external control is provided
    if (externalIsOpen !== undefined) return;
    
    // Check if modal was already shown in this session
    const modalShown = sessionStorage.getItem('getInTouchModalShown');
    
    if (!modalShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        sessionStorage.setItem('getInTouchModalShown', 'true');
      }, 15000); // 15 seconds

      return () => clearTimeout(timer);
    }
  }, [externalIsOpen]);

  const handleClose = () => {
    if (externalOnClose) {
      externalOnClose();
    } else {
      setIsOpen(false);
    }
    setHasSubmitted(false); // Reset flag when closing
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting || hasSubmitted) {
      return;
    }
    
    setIsSubmitting(true);
    setHasSubmitted(true);

    try {
      const payload = {
        name: formData.fullName,
        jobTitle: formData.delegation,
        email: formData.email,
        phone: formData.phone || '',
      };

      // 1. Send contact email
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.contactFormTemplateId,
        {
          name: payload.name,
          job_title: payload.jobTitle,
          email: payload.email,
          phone: payload.phone,
        },
        emailJsConfig.publicKey
      );

      // 2. Send auto-reply email
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.autoReplyTemplateId,
        {
          name: payload.name,
          email: payload.email,
        },
        emailJsConfig.publicKey
      );

      // 3. Save to Google Sheets using no-cors mode (fire and forget)
      // This won't block the success message even if Google Sheets fails
      submitToGoogleSheets(payload);

      // Success - all submissions completed
      setFormData({ fullName: '', delegation: '', email: '', phone: '' });

      // Show success toast
      toast.success('Thanks! We\'ll get back to you soon.', {
        duration: 4000,
        position: 'top-right',
      });

      // Close modal after 3 seconds on success
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Form Submission Error:', error);
      setHasSubmitted(false); // Reset on error so user can retry
      
      // Show error toast
      toast.error('Something went wrong. Please try again.', {
        duration: 4000,
        position: 'top-right',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster />
      <AnimatePresence>
      {modalIsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal Container - Fixed positioning with proper centering */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="relative bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 z-10 p-2 rounded-lg hover:bg-muted transition-colors group"
                  aria-label="Close modal"
                >
                  <IconX size={20} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                </button>

                {/* Content Wrapper */}
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
                      <IconMail size={28} className="text-primary" />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
                      Get in Touch
                    </h2>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Interested in OverSight? Let's chat about how we can help secure your AI systems.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name Field */}
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                          className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>

                    {/* Delegation / Job Title Field */}
                    <div className="space-y-2">
                      <label htmlFor="delegation" className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Delegation / Job Title <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <IconBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          id="delegation"
                          name="delegation"
                          value={formData.delegation}
                          onChange={handleChange}
                          required
                          placeholder="AI Engineer, CTO, etc."
                          className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="john@company.com"
                          className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>

                    {/* Phone/Contact Field (Optional) */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-semibold text-foreground">
                        Phone/Contact
                      </label>
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="IN"
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                        placeholder="Enter phone number"
                        className="w-full"
                        inputComponent={(props) => (
                          <input
                            {...props}
                            className="w-full pl-4 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/60"
                          />
                        )}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-primary text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <IconSend size={18} />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      We respect your privacy. Your information is secure.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};

export default GetInTouchModal;
