import { mdiDeleteOutline, mdiLoading, mdiPencilOutline } from "@mdi/js";
import { Button } from "./ui/button";

import { Icon } from "@mdi/react";

type RowActionsProps = {
  label: string;
  name: string;
  deleting: boolean;
  deletionDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
  editAllowed?: boolean;
  deleteAllowed?: boolean;
};

const iconButton = "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";

export function RowActions({ label, name, deleting, deletionDisabled, onEdit, onDelete, editAllowed = true, deleteAllowed = true }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {editAllowed ? <Button variant="ghost" type="button" className={`${iconButton} hover:bg-muted/50 hover:text-primary`} aria-label={`Редактировать ${label} «${name}»`} title={`Редактировать ${label}`} disabled={deleting} onClick={onEdit}>
        <Icon path={mdiPencilOutline} size={0.83} aria-hidden="true" />
      </Button> : null}
      {deleteAllowed ? <Button variant="ghost" type="button" className={`${iconButton} hover:bg-destructive/10 hover:text-destructive`} aria-label={`${deleting ? "Удаляем" : "Удалить"} ${label} «${name}»`} title={deleting ? "Удаляем…" : `Удалить ${label}`} aria-busy={deleting} disabled={deletionDisabled} onClick={onDelete}>
        <Icon path={deleting ? mdiLoading : mdiDeleteOutline} size={0.83} className={deleting ? "animate-spin" : undefined} aria-hidden="true" />
      </Button> : null}
    </div>
  );
}
