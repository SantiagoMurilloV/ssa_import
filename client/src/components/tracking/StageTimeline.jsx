import { TRACKING_STAGES, stageIndex } from '../../config/tracking.js';
import { formatDateTime } from '../../utils/format.js';
import StageIcon from './StageIcon.jsx';

// Las etapas una debajo de otra, con la fecha en que se alcanzó cada una.
export default function StageTimeline({ tracking }) {
  const current = stageIndex(tracking.stage);
  const history = Array.isArray(tracking.history) ? tracking.history : [];
  const reachedAt = (key) => history.filter((entry) => entry.stage === key).at(-1) ?? null;

  return (
    <ol className="tl" data-stagger>
      {TRACKING_STAGES.map((item, i) => {
        const state = tracking.cancelled ? 'todo' : i < current ? 'done' : i === current ? 'current' : 'todo';
        const entry = state === 'todo' ? null : reachedAt(item.key);
        const isNext = !tracking.cancelled && i === current + 1;
        const showCarrier =
          item.key === 'dispatched' && state !== 'todo' && (tracking.carrier || tracking.trackingNumber || tracking.trackingUrl);
        return (
          <li className={`tl-item is-${state}`} key={item.key}>
            <span className="tl-dot">
              <StageIcon stage={item.key} size={15} />
            </span>
            <div className="tl-body">
              <div className="tl-head">
                <span className="tl-title">{item.label}</span>
                <span className="tl-place">{item.place}</span>
              </div>
              {state !== 'todo' && <p className="tl-desc">{item.description}</p>}
              {isNext && <p className="tl-desc tl-next">Siguiente paso</p>}
              {entry && (
                <time className="tl-time" dateTime={entry.at}>
                  {formatDateTime(entry.at)}
                </time>
              )}
              {entry?.note && <p className="tl-note">“{entry.note}”</p>}
              {showCarrier && (
                <p className="tl-carrier">
                  {tracking.carrier && <span>{tracking.carrier}</span>}
                  {tracking.trackingNumber && <span>Guía {tracking.trackingNumber}</span>}
                  {tracking.trackingUrl && (
                    <a href={tracking.trackingUrl} target="_blank" rel="noreferrer">
                      Rastrear con la transportadora →
                    </a>
                  )}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
