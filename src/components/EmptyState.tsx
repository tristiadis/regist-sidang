'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export default function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-8xl mb-4 animate-bounce">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-center max-w-md mb-6">{description}</p>
      )}
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="btn btn-primary bg-purple-600 hover:bg-purple-700"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="btn btn-primary bg-purple-600 hover:bg-purple-700"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  );
}
