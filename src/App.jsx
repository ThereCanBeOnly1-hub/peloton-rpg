import { ScheduleProvider, useSchedule } from './state/useSchedule.js';
import QuestBoard from './components/QuestBoard.jsx';
import LoginModal from './components/LoginModal.jsx';

// Shows the login modal whenever the schedule layer reports an expired/missing
// session (needsAuth). Lives inside the provider so it can read that flag.
function AuthGate() {
  const { needsAuth, setNeedsAuth, retryPending } = useSchedule();
  if (!needsAuth) return null;
  return (
    <LoginModal
      onClose={() => setNeedsAuth(false)}
      onSuccess={() => { setNeedsAuth(false); retryPending(); }}
    />
  );
}

export default function App() {
  return (
    <ScheduleProvider>
      <QuestBoard />
      <AuthGate />
    </ScheduleProvider>
  );
}
