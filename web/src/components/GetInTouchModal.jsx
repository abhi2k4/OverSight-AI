import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconX, IconMail, IconUser, IconBriefcase, IconSend } from '@tabler/icons-react';
import emailjs from '@emailjs/browser';
import { emailJsConfig } from '@/config/emailjs.config';
import { googleSheetsConfig } from '@/config/googlesheets.config';

const GetInTouchModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    jobRole: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
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
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setSubmitStatus(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const payload = {
        name: formData.name,
        jobTitle: formData.jobRole,
        email: formData.email,
      };

      // 1. Send contact email
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.contactFormTemplateId,
        {
          name: payload.name,
          job_title: payload.jobTitle,
          email: payload.email,
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

      // 3. Save to Google Sheets
      const sheetsResponse = await fetch(googleSheetsConfig.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!sheetsResponse.ok) {
        console.warn('Google Sheets submission warning:', sheetsResponse.statusText);
      }

      // Success - all submissions completed
      setSubmitStatus('success');
      setFormData({ name: '', jobRole: '', email: '' });

      // Close modal after 3 seconds on success
      setTimeout(() => {
        handleClose();
      }, 3000);
    } catch (error) {
      console.error('Form Submission Error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
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
                    {/* Name Field */}
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                          className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-background transition-all text-foreground placeholder:text-muted-foreground/60"
                        />
                      </div>
                    </div>

                    {/* Job Role Field */}
                    <div className="space-y-2">
                      <label htmlFor="jobRole" className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Job Role <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <IconBriefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                        <input
                          type="text"
                          id="jobRole"
                          name="jobRole"
                          value={formData.jobRole}
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

                    {/* Status Messages */}
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm"
                      >
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
                          <span className="text-lg">✓</span> Thanks! We'll get back to you soon.
                        </p>
                      </motion.div>
                    )}

                    {submitStatus === 'error' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
                      >
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                          <span className="text-lg">✗</span> Something went wrong. Please try again or email us directly.
                        </p>
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-primary to-primary/90 text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
  );
};

export default GetInTouchModal;
