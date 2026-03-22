import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiShield,
  FiFileText,
  FiEye,
  FiLock,
  FiAlertCircle
} from "react-icons/fi";

const Policies = () => {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">

      {/* Back Button */}
      <Link
        to="/"
        className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-civic-teal hover:underline"
      >
        <FiArrowLeft size={16} />
        Back to Home
      </Link>

      {/* Title */}
      <h1 className="font-serif text-4xl font-bold text-slate-900 dark:text-white">
        Civic Connect Policies & Governance
      </h1>

      <p className="mt-4 text-slate-600 dark:text-slate-400">
        Civic Connect is designed to promote transparent civic governance,
        responsible data usage, and secure digital public services. The
        following policies outline how the platform operates and protects
        citizen information while enabling efficient complaint management
        between residents and municipal authorities.
      </p>

      {/* Privacy Policy */}
      <section id="privacy" className="mt-14">
        <div className="flex items-center gap-3 text-civic-teal">
          <FiShield size={20} />
          <h2 className="text-2xl font-semibold">Privacy Policy</h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Civic Connect collects limited user information including name,
          email address, location coordinates, and complaint details when
          citizens submit civic issues through the platform.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          This data is used solely for complaint processing, civic analytics,
          and municipal response coordination. Personal information is never
          sold or shared with unauthorized third parties.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Location information collected through the browser geolocation API
          is used only for mapping complaints, identifying civic issue
          hotspots, and routing reports to the correct municipal department.
        </p>
      </section>


      {/* Terms of Service */}
      <section id="terms" className="mt-12">
        <div className="flex items-center gap-3 text-civic-teal">
          <FiFileText size={20} />
          <h2 className="text-2xl font-semibold">Terms of Service</h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          By using Civic Connect, users agree to submit accurate and truthful
          civic complaints. The platform is intended exclusively for reporting
          public infrastructure and municipal service issues.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Misuse of the system, including false reports, spam complaints, or
          abusive content, may result in account suspension or removal from
          the platform.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Civic Connect operates as a digital civic communication platform and
          does not replace official municipal emergency services.
        </p>
      </section>


      {/* Accessibility */}
      <section id="accessibility" className="mt-12">
        <div className="flex items-center gap-3 text-civic-teal">
          <FiEye size={20} />
          <h2 className="text-2xl font-semibold">Accessibility Statement</h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Civic Connect is committed to providing an accessible digital
          platform for all citizens, including individuals with disabilities.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          The platform supports responsive layouts, readable typography,
          keyboard navigation, and mobile accessibility to ensure civic
          participation for all community members.
        </p>
      </section>


      {/* Security Policy */}
      <section id="security" className="mt-12">
        <div className="flex items-center gap-3 text-civic-teal">
          <FiLock size={20} />
          <h2 className="text-2xl font-semibold">Security Policy</h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Civic Connect implements strong security practices to protect user
          accounts and civic complaint data.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Security mechanisms include encrypted communication, JWT-based
          authentication, bcrypt password hashing, and role-based access
          control for administrative functions.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          These measures help ensure safe handling of civic complaint records
          and municipal service data.
        </p>
      </section>


      {/* Disclaimer */}
      <section id="disclaimer" className="mt-12">
        <div className="flex items-center gap-3 text-civic-teal">
          <FiAlertCircle size={20} />
          <h2 className="text-2xl font-semibold">Disclaimer</h2>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Civic Connect provides a digital platform for citizens to report
          civic infrastructure issues and monitor municipal service responses.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          Complaint status updates are dependent on municipal departments
          responsible for resolving reported issues.
        </p>

        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
          The platform aims to improve transparency, accountability, and
          citizen engagement in civic governance.
        </p>
      </section>

    </div>
  );
};

export default Policies;