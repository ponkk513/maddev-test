type Props = {
  message: string;
  onRetry: () => void;
  compact?: boolean;
};

export function ErrorState({ message, onRetry, compact }: Props) {
  return (
    <div role="alert" className={`alert alert--error ${compact ? '' : 'alert--block'}`}>
      <span>{message}</span>
      <button type="button" className="btn btn--small" onClick={onRetry}>
        Повторить
      </button>
    </div>
  );
}
