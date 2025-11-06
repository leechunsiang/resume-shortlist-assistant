'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BeamsBackground } from '@/components/ui/beams-background';

export default function PrivacyPolicyPage() {
  return (
    <BeamsBackground intensity="medium">
      <div className="min-h-screen w-full p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-emerald-400 hover:text-emerald-300 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
            <p className="text-gray-400">Last updated: November 7, 2025</p>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-8 shadow-2xl">
            <div className="prose prose-invert max-w-none">
              <div className="space-y-6 text-gray-300">
                <p className="leading-relaxed">
                  This page explains our privacy policy which includes the use and protection of any information submitted by visitors. If you choose to register and transact using our website or send an e-mail which provides personally identifiable data, this data maybe shared where necessary with other Government agencies so as to serve you in the most efficient and effective manner. An example might be in terms of resolving or addressing complaints that require escalation to other Government agencies.
                </p>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Cookies</h2>
                  <p className="leading-relaxed">
                    Certain websites (including our website) generate 'cookies', which are collected by web-servers to enable them to recognise your future visits. These cookies do not permanently record data and they are not stored on your computer's hard drive. Once you close your browser, the cookie is deleted.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Log Information</h2>
                  <p className="leading-relaxed">
                    When you access the Prime Minister's Office Official Website, our web servers will automatically record information that your browser sends whenever you visit a website. These server logs may include information such as your web request, Internet Protocol address, browser type, browser language, the date and time of your request and one or more cookies that may uniquely identify your browser.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Data Protection</h2>
                  <p className="leading-relaxed">
                    Leading technologies including encryption software is used to safeguard any data given to us and strict security standards are maintained to prevent unauthorised access.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Storage Security</h2>
                  <p className="leading-relaxed">
                    To safeguard your personal data, all electronic storage and transmission of personal data are secured and stored with appropriate security technologies.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Information Collected</h2>
                  <p className="leading-relaxed">
                    No personally identifiable information is gathered during the browsing Prime Minister's Office Official Website except for information given by you via e-mails , which is in a secure portion of the website.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-3">Changes to this Policy</h2>
                  <p className="leading-relaxed">
                    If this privacy policy changes in any way, it will be updated on this page. Regularly reviewing this page ensures you are updated on the information which is collected, how it is used and under what circumstances, if any, it is shared with other parties.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </BeamsBackground>
  );
}
