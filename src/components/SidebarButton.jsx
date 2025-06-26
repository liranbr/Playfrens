import { useState } from "react";
import { ToggleButton } from "react-bootstrap";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MdDeleteOutline, MdEdit, MdMoreVert, MdOutlineSearchOff } from "react-icons/md";
import { toastError } from "../Utils.jsx";
import { removeData } from "../Store.jsx";
import "./SidebarButton.css";
import { modalStore } from "./Modals/ModalStore.jsx";

export function SidebarButton({ value, dataType, setSelection, handleShowModal }) {
    const [checked, setChecked] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    function updateSelection(isChecked) {
        setChecked(isChecked);
        setSelection(prevSelection => {
            return isChecked
                ? [...prevSelection, value]
                : prevSelection.filter(item => item !== value);
        });
    }

    const handleChange = (e) => {
        updateSelection(e.currentTarget.checked);
    };

    return (
        <ToggleButton
            id={"btn-sidebar-" + dataType.key + "-" + value}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            active={dropdownOpen}
            draggable="true"
            onChange={handleChange}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("dataTypeKey", dataType.key);
            }}
        >
            {value}
            <DropdownMenu.Root onOpenChange={setDropdownOpen}>
                <DropdownMenu.Trigger asChild>
                    <button className="icon-button">
                        <MdMoreVert />
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content className="rx-dropdown-menu" align={"start"} side={"bottom"} sideOffset={5}>
                        <DropdownMenu.Item onClick={() => {
                            toastError("Exclude function not yet implemented");
                        }}>
                            <MdOutlineSearchOff /> Exclude
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => {
                            updateSelection(false); //TODO: temporary solution to bug
                            handleShowModal(dataType, value);
                        }}>
                            <MdEdit /> Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Item data-danger onClick={() => {
                            const deleteFunction = () => {
                                updateSelection(false);
                                removeData(dataType, value);
                            };
                            modalStore.open("DeleteWarning", {
                                itemName: value,
                                deleteFunction: deleteFunction
                            });
                        }}>
                            <MdDeleteOutline /> Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </ToggleButton>
    );
}