// User list rows share identity between mobile cards, desktop tables, and the edit dialog.

export interface UserRowType {
  id: string;
  username: string;
  email: string;
  role: string;
}

export interface UserListPropsType {
  users: UserRowType[];
  loading: boolean;
  onEdit: (user: UserRowType) => void;
}
