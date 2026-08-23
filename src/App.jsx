import React, { useState } from 'react';
import RoutesConfig from './components/Routes';
import PinLock from './components/PinLock';
import M2HCountdownModal from './components/M2HCountdownModal';

function App() {
  const [unlocked, setUnlocked] = useState(() => {
    const t = localStorage.getItem("pin_unlocked_at");
    const timeout = parseInt(localStorage.getItem("pin_timeout_minutes") || "15");
    return t && Date.now() - Number(t) < timeout * 60 * 1000;
  });

  function handleUnlock() {
    localStorage.setItem("pin_unlocked_at", Date.now());
    setUnlocked(true);
  }

  if (!unlocked) return <PinLock onUnlock={handleUnlock} />;

  return (
    <div className="App">
      <M2HCountdownModal />
      <RoutesConfig />
    </div>
  );
}

export default App;