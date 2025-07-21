import { observer } from "mobx-react-lite";
import { Modals, modalStore } from "./ModalStore.jsx";
import { EditTagModal } from "./EditTagModal.jsx";
import { EditGameModal } from "./EditGameModal.jsx";
import { PlayfrensModal } from "./PlayfrensModal.jsx";
import { DeleteWarningModal } from "./DeleteWarningModal.jsx";

export const ModalRoot = observer(() => (
    <>
        {modalStore.modalStack.map(({ name, props, open }, index) => {
            const commonProps = {
                ...props,
                open,
                closeModal: modalStore.close,
            };
            switch (name) {
                case Modals.DeleteWarning:
                    return <DeleteWarningModal {...commonProps} key={index} />;
                case Modals.EditTag:
                    return <EditTagModal {...commonProps} key={index} />;
                case Modals.EditGame:
                    return <EditGameModal {...commonProps} key={index} />;
                case Modals.Playfrens:
                    return <PlayfrensModal {...commonProps} key={index} />;
                default:
                    console.warn(`Unknown modal type: ${name}`);
                    return null;
            }
        })}
    </>
));
