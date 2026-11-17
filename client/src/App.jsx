import { useEffect, useState } from 'react';
import { PackageList } from './components/PackageList';
import { PhoneForm } from './components/PhoneForm';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ActiveScreen } from './components/ActiveScreen';
import { FailedScreen } from './components/FailedScreen';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'wifi_session_token';

export default function App() {
  const [screen, setScreen] = useState('packages');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [failureReason, setFailureReason] = useState(null);
  const [checkingSession, setCheckingSession] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  // Resume an active or pending session if the customer refreshes the portal
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sessions/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: savedToken }),
          signal: AbortSignal.timeout(10000),
        });
        const data = await res.json();
        if (cancelled) return;

        if (data.status === 'active') {
          setSessionInfo({ expiresAt: data.expiresAt });
          setScreen('active');
        } else if (data.status === 'pending' || data.status === 'paid' || data.status === 'processing') {
          setToken(savedToken);
          setScreen('processing');
        } else {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
      } catch {
        // Network error on startup — fall back cleanly to packages
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setScreen('phone');
  };

  const handlePurchaseSuccess = (phoneNumber, purchaseToken) => {
    setPhone(phoneNumber);
    setToken(purchaseToken);
    if (purchaseToken) {
      localStorage.setItem(TOKEN_KEY, purchaseToken);
    }
    setScreen('processing');
  };

  const handleAlreadyActive = (phoneNumber, expiresAt) => {
    setPhone(phoneNumber);
    setSessionInfo({ expiresAt });
    setScreen('active');
  };

  const handleActive = (expiresAt) => {
    setSessionInfo({ expiresAt });
    setScreen('active');
  };

  const handleFailed = (reason) => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setFailureReason(reason || 'We couldn\'t activate your session.');
    setScreen('failed');
  };

  const handleRetry = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setFailureReason(null);
    setScreen('phone');
  };

  const handleBackToPackages = () => {
    localStorage.removeItem(TOKEN_KEY);
    setSelectedPackage(null);
    setToken(null);
    setFailureReason(null);
    setScreen('packages');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'packages' && (
        <PackageList onSelect={handlePackageSelect} />
      )}
      {screen === 'phone' && (
        <PhoneForm
          packageId={selectedPackage?.id}
          selectedPackage={selectedPackage}
          onSuccess={handlePurchaseSuccess}
          onAlreadyActive={handleAlreadyActive}
          onBack={handleBackToPackages}
        />
      )}
      {screen === 'processing' && (
        <ProcessingScreen
          token={token}
          onActive={handleActive}
          onFailed={handleFailed}
          onRetry={handleRetry}
        />
      )}
      {screen === 'active' && (
        <ActiveScreen
          sessionInfo={sessionInfo}
          phone={phone}
          selectedPackage={selectedPackage}
        />
      )}
      {screen === 'failed' && (
        <FailedScreen 
          reason={failureReason} 
          onRetry={handleRetry} 
          onBackToPackages={handleBackToPackages} 
        />
      )}
    </div>
  );
}