import { SimpleTooltip } from "@/components";
import "./InfoIcon.css";

export function InfoIcon({ message }) {
    return (
        <SimpleTooltip message={message} delayDuration={0}>
            <span className="info-icon">i</span>
        </SimpleTooltip>
    );
}
