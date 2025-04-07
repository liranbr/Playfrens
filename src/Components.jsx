import { FaPlus } from "react-icons/fa";
import "./Components.css";

export const ButtonAdd = ({ onClick, children }) => {
    return (
        <button className="button-add" onClick={onClick}>
            <FaPlus />
            {children}
        </button>
    );
};