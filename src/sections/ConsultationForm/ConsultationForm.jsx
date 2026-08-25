"use client";

import { useState } from "react";
import "./ConsultationForm.css"

import {
    User,
    Mail,
    Calendar,
    Clock3,
    Briefcase,
    ArrowRight,
    MessageCircle,
} from "lucide-react";

const initialState = {
    name: "",
    email: "",
    date: "",
    time: "",
    service: "",
};

export default function ConsultationForm() {
    const [formData, setFormData] = useState(initialState);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const services = [
        "Debt Review Removal",
        "Prescribed Debt Removal",
        "Credit Bureau Update",
        "Judgement Removal",
        "Credit Advice",
        "Admin Order Removal",
        "IOD - Compensation Fund",
    ];

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const sendToWhatsApp = () => {
        const whatsappMessage = `
Hello Clear Debt,

I'd like to book a consultation.

Name: ${formData.name}

Email: ${formData.email}

Preferred Date: ${formData.date}

Preferred Time: ${formData.time}

Service: ${formData.service}
`;

        window.open(
            `https://wa.me/27722744321?text=${encodeURIComponent(
                whatsappMessage
            )}`,
            "_blank"
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");

        const form = new FormData();

        form.append(
            "access_key",
            "01f6d667-a3a2-4061-a63e-423227779cc4"
        );

        form.append("name", formData.name);
        form.append("email", formData.email);
        form.append("date", formData.date);
        form.append("time", formData.time);
        form.append("service", formData.service);

        try {
            const response = await fetch(
                "https://api.web3forms.com/submit",
                {
                    method: "POST",
                    body: form,
                }
            );

            const result = await response.json();

            if (result.success) {
                setMessage("Consultation booked successfully.");

                setFormData(initialState);
            } else {
                setMessage("Something went wrong.");
            }
        } catch (error) {
            setMessage("Unable to submit the form.");
        }

        setLoading(false);
    };

    return (
        <section className="consultation-section">

            <div className="consultation-card">

                <h2 className="consultation-title">
                    Schedule a Consultation
                </h2>

                <form
                    className="consultation-form"
                    onSubmit={handleSubmit}
                >

                    {/* Name */}
                    <div className="input-group">
                        <User size={18} className="input-icon" />

                        <input
                            type="text"
                            name="name"
                            placeholder="Your Name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="input-group">
                        <Mail size={18} className="input-icon" />

                        <input
                            type="email"
                            name="email"
                            placeholder="Your Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="input-row">

                        <div className="input-group">
                            <Calendar size={18} className="input-icon" />

                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Clock3 size={18} className="input-icon" />

                            <input
                                type="time"
                                name="time"
                                value={formData.time}
                                onChange={handleChange}
                                required
                            />
                        </div>

                    </div>

                    {/* Service */}
                    <div className="input-group">

                        <Briefcase
                            size={18}
                            className="input-icon"
                        />

                        <select
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            required
                        >
                            <option value="">
                                Select a Service
                            </option>

                            {services.map((service) => (
                                <option
                                    key={service}
                                    value={service}
                                >
                                    {service}
                                </option>
                            ))}
                        </select>

                    </div>

                    {message && (
                        <div className="form-message">
                            {message}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            "Booking..."
                        ) : (
                            <>
                                Book Consultation
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>

                    {/* WhatsApp */}
                    <button
                        type="button"
                        className="whatsapp-btn"
                        onClick={sendToWhatsApp}
                    >
                        <MessageCircle size={18} />

                        Book via WhatsApp
                    </button>

                </form>

            </div>

        </section>
    );
}