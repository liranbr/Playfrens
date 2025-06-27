import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Button from "react-bootstrap/Button";
import { addData, editData } from "../../Store.jsx";

export function EditDataModal({ open, closeModal, dataType, dataName = "" }) {
    const mode = dataName ? "Edit" : "Add";
    const title = mode + " " + dataType.single;
    const description = mode === "Edit" ? "Editing " + dataName : "Adding a new " + dataType.single;

    const handleHide = () => closeModal();
    const handleSave = () => {
        const newDataName = document.getElementById("dataNameInput").value;
        const doneFunction = mode === "Edit" ?
            editData(dataType, dataName, newDataName) :
            addData(dataType, newDataName);
        if (doneFunction)
            handleHide();
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>{title}</Dialog.Title>
                    <VisuallyHidden><Dialog.Description>{description}</Dialog.Description></VisuallyHidden>

                    <fieldset>
                        <label>Name</label>
                        <input id="dataNameInput" onKeyDown={saveOnEnter}
                               defaultValue={dataName} autoFocus />
                    </fieldset>

                    <div className="rx-dialog-footer">
                        <Button variant="secondary" onClick={handleHide}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}