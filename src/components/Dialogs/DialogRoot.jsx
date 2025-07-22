import { observer } from "mobx-react-lite";
import { Dialogs, dialogStore } from "./DialogStore.jsx";
import { EditTagDialog } from "./EditTagDialog.jsx";
import { EditGameDialog } from "./EditGameDialog.jsx";
import { PlayfrensDialog } from "./PlayfrensDialog.jsx";
import { DeleteWarningDialog } from "./DeleteWarningDialog.jsx";

export const DialogRoot = observer(() => (
    <>
        {dialogStore.dialogStack.map(({ name, props, open }, index) => {
            const commonProps = {
                ...props,
                open,
                closeDialog: dialogStore.close,
            };
            switch (name) {
                case Dialogs.DeleteWarning:
                    return <DeleteWarningDialog {...commonProps} key={index} />;
                case Dialogs.EditTag:
                    return <EditTagDialog {...commonProps} key={index} />;
                case Dialogs.EditGame:
                    return <EditGameDialog {...commonProps} key={index} />;
                case Dialogs.Playfrens:
                    return <PlayfrensDialog {...commonProps} key={index} />;
                default:
                    console.warn(`Unknown dialog type: ${name}`);
                    return null;
            }
        })}
    </>
));
