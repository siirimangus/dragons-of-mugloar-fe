import type { Advice } from '../domain/types';
import styles from './Advisor.module.css';

type Props = {
  readonly advice: Advice;
  readonly disabled: boolean;
  readonly onDo: () => void;
};

export function Advisor({ advice, disabled, onDo }: Props) {
  return (
    <section className={styles.advisor} aria-labelledby="advisor-title">
      <h2 id="advisor-title">Advisor</h2>
      <p className={styles.headline}>{advice.headline}</p>
      <p className={styles.reason}>{advice.reason}</p>
      <button type="button" onClick={onDo} disabled={disabled || advice.kind === 'none'}>
        Do it
      </button>
    </section>
  );
}
