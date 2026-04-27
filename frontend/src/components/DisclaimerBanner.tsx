'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export function DisclaimerBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const shouldHidePopup = useMemo(
    () =>
      pathname.startsWith('/student') ||
      pathname.startsWith('/instructor') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/auth/callback'),
    [pathname]
  );

  useEffect(() => {
    if (shouldHidePopup) {
      setIsOpen(false);
      return;
    }

    const hasSeenPopup = sessionStorage.getItem('siteDisclaimerSeen');
    if (hasSeenPopup) return;

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [shouldHidePopup]);

  const closePopup = () => {
    sessionStorage.setItem('siteDisclaimerSeen', 'true');
    setIsOpen(false);
  };

  if (!isOpen || shouldHidePopup) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 px-4 pb-6 pt-24 backdrop-blur-sm sm:pt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div
            className="flex items-start justify-between gap-4 border-b border-border px-6 py-5"
            style={{ background: 'linear-gradient(to right, var(--brand-pink-light), white)' }}
          >
            <div>
              <h2 className="text-2xl font-bold text-foreground">Legal Disclaimer</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Educational Purposes Only
              </p>
            </div>
            <button
              type="button"
              onClick={closePopup}
              className="rounded-lg p-2 transition-colors hover:bg-white/70"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5 text-sm leading-7 text-foreground">
            <p className="text-justify">
              The information provided on this website is for general educational and
              informational purposes only. While we strive to keep the information up to
              date and correct, we make no representations or warranties of any kind,
              express or implied, about the completeness, accuracy, reliability,
              suitability, or availability with respect to the website or the
              information, products, services, or related graphics contained on the
              website for any purpose. Any reliance you place on such information is
              therefore strictly at your own risk.
            </p>

            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Compliance with Philippine Laws
              </h3>
              <p className="mt-2 text-justify">
                In accordance with the laws of the Republic of the Philippines, this
                website operates under the following frameworks:
              </p>
              <ul className="mt-3 list-disc space-y-3 pl-6">
                <li className="text-justify">
                  Republic Act No. 8293 (Intellectual Property Code of the
                  Philippines): All content, unless otherwise stated, is protected by
                  intellectual property laws. Unauthorized use or reproduction of
                  material without proper attribution or consent is prohibited.
                </li>
                <li className="text-justify">
                  Republic Act No. 10175 (Cybercrime Prevention Act of 2012): This
                  website adheres to the guidelines set forth to prevent cyber-squatting,
                  identity theft, and the dissemination of harmful digital content.
                </li>
                <li className="text-justify">
                  Republic Act No. 10173 (Data Privacy Act of 2012): We are committed
                  to protecting your personal data. Any information collected through
                  this site is handled in strict compliance with the National Privacy
                  Commission&apos;s standards.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground">External Links</h3>
              <p className="mt-2 text-justify">
                Through this website, you may be able to link to other websites which
                are not under our control. The inclusion of any links does not
                necessarily imply a recommendation or endorse the views expressed within
                them.
              </p>
            </div>
          </div>

          <div className="border-t border-border bg-gray-50 px-6 py-4 text-right">
            <button
              type="button"
              onClick={closePopup}
              className="rounded-lg px-5 py-2 text-white transition-all hover:scale-105"
              style={{ backgroundColor: 'var(--brand-green-dark)' }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
