import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Button from "react-bootstrap/Button";
import { addData, editData } from "../Store.jsx";

export function EditDataModal({ show, setShow, dataType, editedDataName = "" }) {
    const mode = editedDataName ? "Edit" : "Add";
    const title = mode + " " + dataType.single;
    const description = mode === "Edit" ? "Editing " + editedDataName : "Adding a new " + dataType.single;

    const handleHide = () => setShow(false);
    const handleSave = () => {
        const dataName = document.getElementById("dataNameInput").value;
        const doneFunction = mode === "Edit" ?
            editData(dataType, editedDataName, dataName) :
            addData(dataType, dataName);
        if (doneFunction)
            setShow(false);
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Dialog.Root open={show} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>{title}</Dialog.Title>
                    <VisuallyHidden><Dialog.Description>{description}</Dialog.Description></VisuallyHidden>

                    <fieldset>
                        <label>Name</label>
                        <input id="dataNameInput" onKeyDown={saveOnEnter}
                               defaultValue={editedDataName} autoFocus />
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