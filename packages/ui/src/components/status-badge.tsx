import { Badge } from "./ui/badge";
import { ActionStatus, ActionType } from "@mining-hub/types";

interface StatusBadgeProps {
  status: ActionStatus | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
      case 'active':
        return 'destructive';
      case 'done':
      case 'completed':
      case 'granted':
        return 'success';
      case 'snoozed':
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {status}
    </Badge>
  );
}

interface ActionTypeBadgeProps {
  type: ActionType | string;
  className?: string;
}

export function ActionTypeBadge({ type, className }: ActionTypeBadgeProps) {
  const getVariant = (type: string) => {
    switch (type) {
      case 'Anniversary':
        return 'default';
      case 'RentDue':
        return 'warning';
      case 'Section29':
        return 'destructive';
      case 'AdHoc':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant(type)} className={className}>
      {type}
    </Badge>
  );
}
