import React, { useState, useEffect } from "react";
import { ContactFormState, FormErrors } from "../types";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import type { ContactInfo, ContactFormConfig } from "../src/types/database.types";
import { EditableText } from "../src/components/editor/EditableText";
import { useEditor } from "../src/contexts/EditorContext";
import { useWebsite } from "../src/contexts/WebsiteContext";
import { useToast } from "../src/components/Toast";

export const Contact: React.FC = () => {
  const [content, setContent] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { isEditing, saveField } = useEditor();
  const { websiteData, loading: websiteLoading } = useWebsite();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<ContactFormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!websiteLoading && websiteData?.content?.contact) {
      setContent(websiteData.content.contact as ContactInfo);
      setLoading(false);
    } else if (!websiteLoading) {
      // Handle case where contact data might be missing or default
      setLoading(false);
    }
  }, [websiteData, websiteLoading]);


  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.subject.trim()) newErrors.subject = "Subject is required";
    if (!formData.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate() && content) {
      setIsSubmitting(true);
      try {
        // Get contact form config from website data
        const contactFormConfig = websiteData?.contactformconfig as ContactFormConfig | undefined;
        
        // Use env variable as fallback if not configured per-website
        const appsScriptUrl = contactFormConfig?.appsScriptUrl || import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;
        const clientId = contactFormConfig?.clientId || "default";

        if (!appsScriptUrl) {
          // If Google Apps Script not configured at all, show error
          console.warn("Contact form not configured. Please set up Google Apps Script integration.");
          showToast("Contact form is not configured. Please contact the website owner.", "warning");
          return;
        }

        // Send to Google Apps Script
        const response = await fetch(appsScriptUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: clientId,
            name: formData.name,
            email: formData.email,
            type: formData.subject, // Maps to "type" in Apps Script
            message: formData.message,
          }),
          mode: "no-cors", // Google Apps Script requires no-cors mode
        });

        // With no-cors, we can't read the response, but if it doesn't throw, it succeeded
        setIsSuccess(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setIsSuccess(false), 5000);
      } catch (error) {
        console.error("Error submitting contact form:", error);
        showToast("Something went wrong. Please try again later.", "error");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (loading) {
    return (
      <section
        id="contact"
        className="py-20 bg-bakery-light flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bakery-primary mx-auto mb-4"></div>
          <p className="font-sans text-bakery-text/80">Loading...</p>
        </div>
      </section>
    );
  }

  if (!content) return null;

  return (
    <section id="contact" className="py-20 bg-bakery-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Info Side */}
          <div className="space-y-8">
            <div>
              {isEditing ? (
                <EditableText
                  value={content.heading}
                  onSave={async (newValue) => {
                    await saveField("contact", "heading", newValue);
                    setContent({ ...content, heading: newValue });
                  }}
                  tag="h2"
                  className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-6"
                />
              ) : (
                <h2 className="font-serif text-4xl md:text-5xl font-bold text-bakery-dark mb-6">
                  {content.heading}
                </h2>
              )}
              {content.subheading &&
                (isEditing ? (
                  <EditableText
                    value={content.subheading}
                    onSave={async (newValue) => {
                      await saveField(
                        "contact",
                        "subheading",
                        newValue,
                      );
                      setContent({ ...content, subheading: newValue });
                    }}
                    tag="p"
                    multiline
                    className="text-lg text-bakery-text/80 font-sans leading-relaxed"
                  />
                ) : (
                  <p className="text-lg text-bakery-text/80 font-sans leading-relaxed">
                    {content.subheading}
                  </p>
                ))}
            </div>

            <div className="grid gap-6">
              {content.address && (
                <div className="flex items-start space-x-4">
                  <div className="bg-bakery-cream p-3 rounded-full text-bakery-primary">
                    <MapPin size={24} />
                  </div>
                  <div>
                    {isEditing ? (
                      <EditableText
                        value="Location"
                        onSave={async () => { }}
                        tag="h3"
                        className="font-serif font-bold text-xl text-bakery-dark"
                      />
                    ) : (
                      <h3 className="font-serif font-bold text-xl text-bakery-dark">
                        Location
                      </h3>
                    )}
                    <p className="text-bakery-text/80 font-sans">
                      {isEditing ? (
                        <>
                          <EditableText
                            value={content.address || ""}
                            onSave={async (newValue) => {
                              await saveField(
                                "contact",
                                "address",
                                newValue,
                              );
                              setContent({ ...content, address: newValue });
                            }}
                            tag="span"
                            className="text-bakery-text/80 font-sans"
                          />
                          <br />
                          <EditableText
                            value={`${content.city}, ${content.state} ${content.zip_code}`}
                            onSave={async (newValue) => {
                              const parts = newValue.split(", ");
                              const city = parts[0];
                              const stateZip = parts[1]?.split(" ") || [];
                              const state = stateZip[0] || "";
                              const zip = stateZip[1] || "";
                              await saveField(
                                "contact",
                                "city",
                                city,
                              );
                              await saveField(
                                "contact",
                                "state",
                                state,
                              );
                              await saveField(
                                "contact",
                                "zip_code",
                                zip,
                              );
                              setContent({
                                ...content,
                                city,
                                state,
                                zip_code: zip,
                              });
                            }}
                            tag="span"
                            className="text-bakery-text/80 font-sans"
                          />
                        </>
                      ) : (
                        <>
                          {content.address}
                          <br />
                          {content.city}, {content.state} {content.zip_code}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-4">
                <div className="bg-bakery-cream p-3 rounded-full text-bakery-primary">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-xl text-bakery-dark">
                    Hours
                  </h3>
                  <p className="text-bakery-text/80 font-sans">
                    Mon - Fri: 7:00 AM - 7:00 PM
                    <br />
                    Sat - Sun: 8:00 AM - 5:00 PM
                  </p>
                </div>
              </div>

              {(content.phone || content.email) && (
                <div className="flex items-start space-x-4">
                  <div className="bg-bakery-cream p-3 rounded-full text-bakery-primary">
                    <Phone size={24} />
                  </div>
                  <div>
                    {isEditing ? (
                      <EditableText
                        value="Contact"
                        onSave={async () => { }}
                        tag="h3"
                        className="font-serif font-bold text-xl text-bakery-dark"
                      />
                    ) : (
                      <h3 className="font-serif font-bold text-xl text-bakery-dark">
                        Contact
                      </h3>
                    )}
                    <p className="text-bakery-text/80 font-sans">
                      {isEditing ? (
                        <>
                          {content.phone && (
                            <>
                              <EditableText
                                value={content.phone}
                                onSave={async (newValue) => {
                                  await saveField(
                                    "contact",
                                    "phone",
                                    newValue,
                                  );
                                  setContent({ ...content, phone: newValue });
                                }}
                                tag="span"
                                className="text-bakery-text/80 font-sans"
                              />
                              <br />
                            </>
                          )}
                          <EditableText
                            value={content.email || ""}
                            onSave={async (newValue) => {
                              await saveField(
                                "contact",
                                "email",
                                newValue,
                              );
                              setContent({ ...content, email: newValue });
                            }}
                            tag="span"
                            className="text-bakery-text/80 font-sans"
                          />
                        </>
                      ) : (
                        <>
                          {content.phone && (
                            <>
                              {content.phone}
                              <br />
                            </>
                          )}
                          {content.email}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-bakery-cream p-8 md:p-10 rounded-2xl shadow-lg border border-bakery-sand">
            <h3 className="font-serif text-3xl font-bold text-bakery-dark mb-6">
              Send a Message
            </h3>

            {isSuccess && (
              <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg border border-green-200 flex items-center">
                <span className="font-sans font-medium">
                  Thank you! Your message has been sent.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-bold text-bakery-dark mb-1 font-serif"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${errors.name
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-bakery-sand focus:ring-bakery-primary/30 focus:border-bakery-primary"
                      }`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500 font-sans">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-bakery-dark mb-1 font-serif"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${errors.email
                      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                      : "border-bakery-sand focus:ring-bakery-primary/30 focus:border-bakery-primary"
                      }`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500 font-sans">
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-bold text-bakery-dark mb-1 font-serif"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${errors.subject
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-bakery-sand focus:ring-bakery-primary/30 focus:border-bakery-primary"
                    }`}
                  placeholder="Catering Inquiry"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-500 font-sans">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-bold text-bakery-dark mb-1 font-serif"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:outline-none transition-colors ${errors.message
                    ? "border-red-300 focus:ring-red-200 focus:border-red-400"
                    : "border-bakery-sand focus:ring-bakery-primary/30 focus:border-bakery-primary"
                    }`}
                  placeholder="Tell us what you're craving..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-500 font-sans">
                    {errors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 px-6 rounded-lg font-serif font-bold text-white text-lg shadow-md transition-all flex items-center justify-center space-x-2 ${
                  isSubmitting
                    ? "bg-bakery-primary/70 cursor-not-allowed"
                    : "bg-bakery-primary hover:bg-bakery-dark hover:shadow-lg"
                }`}
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};