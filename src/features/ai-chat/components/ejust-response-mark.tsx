export const EjustResponseMark = ({
  phase = 'complete',
}: {
  phase?: 'thinking' | 'streaming' | 'complete';
}) => (
  <span className="ejust-response-mark" data-phase={phase} aria-hidden>
    <img src="/ejust-logo.png" alt="" />
    {phase === 'thinking' && <span className="ejust-response-trace" />}
    {phase !== 'complete' && <span className="ejust-response-center" />}
  </span>
);
