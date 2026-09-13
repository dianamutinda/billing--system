import { useState } from 'react';
import { PackageList } from './components/PackageList';
import { PhoneForm } from './components/PhoneForm';
import { ProcessingScreen } from './components/ProcessingScreen';
import { ActiveScreen } from './components/ActiveScreen';
import { FailedScreen } from './components/FailedScreen';

export default function App() {
  const [screen, setScreen] = useState('packages');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);

  const handlePackageSelect = (id) => {
    setPackageId(id);
    setScreen('phone');
  };

  const handlePurchaseSuccess = (phoneNumber) => {
    setPhone(phoneNumber);
    setScreen('processing');
  };

  const handleActive = (expiresAt) => {
    setSessionInfo({expiresAt});
    setScreen('active');
  };

  const handleFailed = () => {
    setScreen('failed');
  };

  const handleRetry = () => {
    setScreen('phone');
  };

  const handleBackToPackages = () => {
    setPackageId(null);
    setScreen('packages');
  };

    return (
    <div className="min-h-screen bg-slate-50">
      {screen === 'packages' && (
        <PackageList onSelect={handlePackageSelect} />
      )}
      {screen === 'phone' && (
        <PhoneForm
          packageId={packageId}
          onSuccess={handlePurchaseSuccess}
        />
      )}
      {screen === 'processing' && (
        <ProcessingScreen
          phone={phone}
          onActive={handleActive}
          onFailed={handleFailed}
        />
      )}
      {screen === 'active' && (
        <ActiveScreen sessionInfo={sessionInfo} phone={phone} packageId={packageId} />
      )}
      {screen === 'failed' && (
        <FailedScreen onRetry={handleRetry} onBackToPackages={handleBackToPackages} />
      )}
    </div>
  );
}

