import Link from "next/link";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  action?: EmptyStateAction;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="py-20 flex flex-col items-center text-center gap-4">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
        <Icon className="w-8 h-8" />
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-1.5">
        <h3 className="font-syne text-xl font-bold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-white/50 max-w-xs">{description}</p>
        )}
      </div>

      {/* Action */}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl px-5 py-2.5 font-semibold hover:scale-[1.02] transition-all text-sm shadow-lg shadow-violet-500/25"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl px-5 py-2.5 font-semibold hover:scale-[1.02] transition-all text-sm shadow-lg shadow-violet-500/25"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}
