import { mdiDeleteOutline, mdiLoading, mdiPencilOutline } from "@mdi/js";
import { Icon } from "@mdi/react";

type RowActionsProps = {
  label: string;
  name: string;
  deleting: boolean;
  deletionDisabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

const iconButton = "inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";

export function RowActions({ label, name, deleting, deletionDisabled, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button type="button" className={`${iconButton} hover:bg-slate-50 hover:text-blue-600`} aria-label={`Редактировать ${label} «${name}»`} title={`Редактировать ${label}`} disabled={deleting} onClick={onEdit}>
        <Icon path={mdiPencilOutline} size={0.83} aria-hidden="true" />
      </button>
      <button type="button" className={`${iconButton} hover:bg-red-50 hover:text-red-600`} aria-label={`${deleting ? "Удаляем" : "Удалить"} ${label} «${name}»`} title={deleting ? "Удаляем…" : `Удалить ${label}`} aria-busy={deleting} disabled={deletionDisabled} onClick={onDelete}>
        <Icon path={deleting ? mdiLoading : mdiDeleteOutline} size={0.83} className={deleting ? "animate-spin" : undefined} aria-hidden="true" />
      </button>
    </div>
  );
}
