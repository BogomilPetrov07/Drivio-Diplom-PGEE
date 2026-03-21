import { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react'; // Optional: for icons

const CookieBanner = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('cookie-consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 transition-all duration-300 ease-in-out transform translate-y-0">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <Cookie className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                            We use cookies
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                            We use cookies to enhance your experience and analyze our traffic.
                            By clicking "Accept", you consent to our use of cookies.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="mt-4 flex gap-3">
                    <button
                        onClick={acceptCookies}
                        className="flex-1 bg-gray-900 text-white text-xs font-medium py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Accept All
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="flex-1 bg-gray-100 text-gray-700 text-xs font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieBanner;