
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { PackageList } from '../../components/portal/PackageList';
import { PhoneForm } from '../../components/portal/PhoneForm';
import { ProcessingScreen } from '../../components/portal/ProcessingScreen';
import { ActiveScreen } from '../../components/portal/ActiveScreen';
import { FailedScreen } from '../../components/portal/FailedScreen';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function PortalInner({ slug }) {
  const tokenKey = `wifi_session_token:${slug}`;

  const [screen, setScreen] = useState('packages');
  const [phone, setPhone] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [failureReason, setFailureReason] = useState(null);

  const [checkingSession, setCheckingSession] = useState(
    () => Boolean(localStorage.getItem(tokenKey))
  );

  // Resume an active or pending session after refreshing the portal
  useEffect(() => {
    const savedToken = localStorage.getItem(tokenKey);

    if (!savedToken) {
      setCheckingSession(false);
      return;
    }

    let cancelled = false;

    async function checkSession() {
      try {
        const res = await fetch(`${API_BASE}/api/sessions/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: savedToken }),
          signal: AbortSignal.timeout(10000),
        });

        const data = await res.json();

        if (cancelled) return;

        if (data.status === 'active') {
          setToken(savedToken);
          setSessionInfo({ expiresAt: data.expiresAt });
          setScreen('active');
        } else if (
          data.status === 'pending' ||
          data.status === 'paid' ||
          data.status === 'processing' ||
          data.status === 'activating'
        ) {
          setToken(savedToken);
          setScreen('processing');
        } else {
          localStorage.removeItem(tokenKey);
          setToken(null);
        }
      } catch {
        // Keep the saved token. The customer can retry when connected.
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [tokenKey]);

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setScreen('phone');
  };

  const handlePurchaseSuccess = (phoneNumber, purchaseToken) => {
    setPhone(phoneNumber);
    setToken(purchaseToken);

    if (purchaseToken) {
      localStorage.setItem(tokenKey, purchaseToken);
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
    localStorage.removeItem(tokenKey);
    setToken(null);
    setFailureReason(
      reason || "We couldn't activate your session."
    );
    setScreen('failed');
  };

  const handleRetry = () => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setFailureReason(null);
    setScreen('phone');
  };

  const handleBackToPackages = () => {
    localStorage.removeItem(tokenKey);
    setSelectedPackage(null);
    setToken(null);
    setFailureReason(null);
    setScreen('packages');
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Checking session...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'packages' && (
        <PackageList
          slug={slug}
          onSelect={handlePackageSelect}
        />
      )}

      {screen === 'phone' && (
        <PhoneForm
          slug={slug}
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

export default function Portal() {
  const { portalSlug } = useParams();

  if (!portalSlug) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center text-slate-600">
        Please open the Wi-Fi link provided by your hotspot owner.
      </div>
    );
  }

  return <PortalInner key={portalSlug} slug={portalSlug} />;
}
