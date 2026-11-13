import { useEffect, useId, useRef, useState } from 'react';
import type { Ad, AdInsight, Risk } from '../../domain/types';
import { formatPercent, formatValue, pluralize } from '../../utils/format';
import styles from './AdCard.module.css';

type Props = {
    readonly ad: Ad;
    readonly insight: AdInsight;
    readonly recommended: boolean;
    readonly unavailable: boolean;
    readonly disabled: boolean;
    readonly onSolve: (adId: string) => void;
};

const RISK_LABEL: Record<Risk, string> = {
    low: 'Low risk',
    medium: 'Medium risk',
    high: 'High risk',
};

export function AdCard({ ad, insight, recommended, unavailable, disabled, onSolve }: Props) {
    const [confirming, setConfirming] = useState(false);
    const blocked = disabled || unavailable;
    const messageId = useId();
    const solveRef = useRef<HTMLButtonElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const wasConfirming = useRef(false);

    useEffect(() => {
        if (confirming) {
            cancelRef.current?.focus();
        } else if (wasConfirming.current) {
            solveRef.current?.focus();
        }
        wasConfirming.current = confirming;
    }, [confirming]);

    return (
        <li
            className={`${styles.card} ${insight.trap ? styles.trap : ''} ${unavailable ? styles.unavailable : ''}`}
        >
            <div className={styles.badges}>
                {recommended && <span className={styles.recommended}>Recommended</span>}
                {insight.trap && <span className={styles.trapBadge}>Trap likely</span>}
                {unavailable && <span className={styles.gone}>No longer available</span>}
            </div>
            <p id={messageId} className={styles.message}>
                {ad.message}
            </p>
            <dl className={styles.facts}>
                <div>
                    <dt>Reward</dt>
                    <dd>{ad.reward} gold</dd>
                </div>
                <div>
                    <dt>Expires in</dt>
                    <dd>{pluralize(ad.expiresIn, 'turn')}</dd>
                </div>
                <div>
                    <dt>Label</dt>
                    <dd>{ad.probability}</dd>
                </div>
                {!insight.trap && (
                    <>
                        <div>
                            <dt>Success</dt>
                            <dd>~{formatPercent(insight.probability)}</dd>
                        </div>
                        <div>
                            <dt>Value</dt>
                            <dd>{formatValue(insight.value)}</dd>
                        </div>
                        <div>
                            <dt>Risk</dt>
                            <dd className={styles[insight.risk]}>{RISK_LABEL[insight.risk]}</dd>
                        </div>
                    </>
                )}
            </dl>
            {insight.trap && (
                <p className={styles.warning}>
                    The label is misleading: ads like this almost always cost a life.
                </p>
            )}

            {insight.trap && confirming ? (
                <div
                    role="group"
                    aria-label="Confirm solving a trap"
                    className={styles.actions}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') setConfirming(false);
                    }}
                >
                    <p>You will probably lose a life. Solve it anyway?</p>
                    <button
                        type="button"
                        aria-describedby={messageId}
                        onClick={() => onSolve(ad.adId)}
                        disabled={blocked}
                    >
                        Yes, solve anyway
                    </button>
                    <button
                        ref={cancelRef}
                        type="button"
                        className="secondary"
                        onClick={() => setConfirming(false)}
                    >
                        Cancel
                    </button>
                </div>
            ) : (
                <div className={styles.actions}>
                    <button
                        ref={solveRef}
                        aria-describedby={messageId}
                        type="button"
                        onClick={() => (insight.trap ? setConfirming(true) : onSolve(ad.adId))}
                        disabled={blocked}
                    >
                        {insight.trap ? 'Solve anyway' : 'Solve'}
                    </button>
                </div>
            )}
        </li>
    );
}
