import React, { useState } from 'react';
import RoutesConfig from './components/Routes';
import PinLock from './components/PinLock';

function App() {
  const [unlocked, setUnlocked] = useState(() => {
    const pinEnabled = localStorage.getItem("pin_lock_enabled") !== "false";
    if (!pinEnabled) return true;
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
      <RoutesConfig />
    </div>
  );
}

export default App;