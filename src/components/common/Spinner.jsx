import "./Spinner.css";
import { FaSpinner } from "react-icons/fa";

export function Spinner() {
    return (
        <div className="centered-flex">
            <FaSpinner className="spinner" aria-label="Loading" role="status" />
        </div>
    );
}
