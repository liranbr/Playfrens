import { observer } from "mobx-react-lite";
import { modalStore } from "./ModalStore.jsx";
import { EditDataModal } from "../EditDataModal.jsx";
import { EditGameModal } from "../EditGameModal.jsx";
import { PlayfrensModal } from "../PlayfrensModal/index.js";
import { DeleteWarningModal } from "../DeleteWarningModal.jsx";

export const ModalRoot = observer(() => (
    <>
        {modalStore.modalStack.map(({ name, props, open }, index) => {
            const commonProps = {
                ...props,
                open,
                closeModal: modalStore.close
            };

            switch (name) {
                case "DeleteWarning":
                    return <DeleteWarningModal {...commonProps} key={index} />;
                case "EditData":
                    return <EditDataModal {...commonProps} key={index} />;
                case "EditGame":
                    return <EditGameModal {...commonProps} key={index} />;
                case "Playfrens":
                    return <PlayfrensModal {...commonProps} key={index} />;
                default:
                    return null;
            }
        })}
    </>
));