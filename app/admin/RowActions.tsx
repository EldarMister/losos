
import { translateAdmin as t } from "./i18n/store";
import { useAdminLanguage } from "./i18n/react";
import { Ellipsis, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
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
export function RowActions({ label, name, deleting, deletionDisabled, onEdit, onDelete, editAllowed = true, deleteAllowed = true }: RowActionsProps) {
    useAdminLanguage();
    if (!editAllowed && !deleteAllowed)
        return null;
    return (<div className="flex justify-end"><DropdownMenu>
      <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon" aria-label={t("Действия: {0}", { "0": name })} disabled={deleting}/>}>
        {deleting ? <LoaderCircle className="size-4 animate-spin"/> : <Ellipsis className="size-4"/>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {editAllowed ? <DropdownMenuItem onClick={onEdit}><Pencil className="size-4"/>{t("Редактировать")}</DropdownMenuItem> : null}
        {editAllowed && deleteAllowed ? <DropdownMenuSeparator /> : null}
        {deleteAllowed ? <DropdownMenuItem variant="destructive" aria-label={t("Удалить {0} \u00AB{1}\u00BB", { "0": label, "1": name })} disabled={deletionDisabled} onClick={onDelete}><Trash2 className="size-4"/>{t("Удалить")}</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu></div>);
}
