import { useEffect, useRef, useState } from 'react';
import type { Advice } from '../../domain/types';
import styles from './Advisor.module.css';

type Props = {
    readonly advice: Advice;
    readonly disabled: boolean;
    readonly onDo: () => void;
};

export function Advisor({ advice, disabled, onDo }: Props) {
    // Tied to the ad it was opened for, so new advice cancels a half-finished confirmation.
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const confirming = advice.confirm && confirmingId === advice.targetId;
    const doRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const wasConfirming = useRef(false);

    useEffect(() => {
        if (confirming) {
            cancelRef.current?.focus();
        } else if (wasConfirming.current) {
            doRef.current?.focus();
        }
        wasConfirming.current = confirming;
    }, [confirming]);

    return (
        <section className={styles.advisor} aria-labelledby="advisor-title">
            <h2 id="advisor-title">Advisor</h2>
            <p className={styles.headline}>{advice.headline}</p>
            <p className={styles.reason}>{advice.reason}</p>
            {confirming ? (
                <div
                    role="group"
                    aria-label="Confirm the advice"
                    className={styles.actions}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') setConfirmingId(null);
                    }}
                >
                    <p>You will probably lose a life. Do it anyway?</p>
                    <button type="button" onClick={onDo} disabled={disabled}>
                        Yes, do it anyway
                    </button>
                    <button
                        ref={cancelRef}
                        type="button"
                        className="secondary"
                        onClick={() => setConfirmingId(null)}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <button
                    ref={doRef}
                    type="button"
                    onClick={() => (advice.confirm ? setConfirmingId(advice.targetId) : onDo())}
                    disabled={disabled || advice.kind === 'none'}
                >
                    Do it
                </button>
            )}
        </section>
    );
}
