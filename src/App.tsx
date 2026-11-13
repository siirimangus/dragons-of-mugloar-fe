import { GameScreen } from './screens/GameScreen';
import { StartScreen } from './screens/StartScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { useGameState } from './state/game-context';

export function App() {
  const { phase } = useGameState();
  if (phase === 'playing') return <GameScreen />;
  if (phase === 'finished') return <SummaryScreen />;
  return <StartScreen />;
}
